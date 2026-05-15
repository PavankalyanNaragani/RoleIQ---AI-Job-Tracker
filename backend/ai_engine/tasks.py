import logging
import re
from celery import shared_task
from django.utils import timezone
from pydantic import BaseModel
from typing import List

logger = logging.getLogger('ai_engine')
CV_SECTIONS = ['summary', 'experience', 'skills', 'cover_letter']
RESUME_SECTIONS = ['summary', 'work_experience', 'skills', 'education_projects']


class ResumeScoreOutput(BaseModel):
    score: int
    confidence: int
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str


COMMON_SKILLS = [
    'python', 'java', 'javascript', 'typescript', 'react', 'node', 'django', 'flask',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'aws', 'azure', 'docker',
    'kubernetes', 'git', 'rest', 'api', 'machine learning', 'data analysis',
    'excel', 'power bi', 'tableau', 'communication', 'leadership',
]


def _fallback_resume_analysis(resume_text: str):
    text = (resume_text or '').lower()
    words = re.findall(r'[a-zA-Z0-9+#.-]+', text)
    word_count = len(words)

    found_skills = [s for s in COMMON_SKILLS if s in text]
    formatting_issues = []
    if word_count < 200:
        formatting_issues.append('Resume content is too short for reliable ATS parsing.')
    if '@' not in text:
        formatting_issues.append('Contact email not clearly detected.')
    if not any(k in text for k in ['experience', 'education', 'skills']):
        formatting_issues.append('Standard section headings may be missing.')

    score = 35
    score += min(len(found_skills) * 3, 30)
    if word_count > 350:
        score += 15
    score = max(20, min(score, 88))

    return {
        'skills_detected': found_skills[:20],
        'experience_years': 0,
        'strengths': [
            'Resume text successfully extracted.',
            'Contains detectable skill keywords.',
        ] if found_skills else ['Resume text successfully extracted.'],
        'weaknesses': [
            'AI-based analysis service was unreachable; this is a heuristic score.',
            'Add more quantified achievements for stronger ATS ranking.',
        ],
        'ats_score': score,
        'ats_feedback': 'Offline fallback score generated because AI analysis service was unavailable.',
        'formatting_issues': formatting_issues,
    }


@shared_task(bind=True, max_retries=3)
def analyze_resume_task(self, resume_id):
    from resumes.models import Resume
    from ai_engine.models import ResumeAnalysis
    from ai_engine.agents.resume_analyzer import RESUME_ANALYZER

    try:
        resume = Resume.objects.get(id=resume_id)

        if not resume.raw_text.strip():
            logger.warning(f'Resume {resume_id} has no text — skipping analysis')
            return

        analysis, _ = ResumeAnalysis.objects.get_or_create(resume=resume)
        analysis.status = 'PROCESSING'
        analysis.error_message = None
        analysis.save()

        if resume.content_hash:
            siblings = Resume.objects.filter(
                user=resume.user,
                content_hash=resume.content_hash,
            ).exclude(id=resume.id).order_by('-uploaded_at')
            for sibling in siblings:
                sibling_analysis = getattr(sibling, 'analysis', None)
                if sibling_analysis and sibling_analysis.status == 'DONE':
                    analysis.skills_detected = sibling_analysis.skills_detected
                    analysis.experience_years = sibling_analysis.experience_years
                    analysis.strengths = sibling_analysis.strengths
                    analysis.weaknesses = sibling_analysis.weaknesses
                    analysis.ats_score = sibling_analysis.ats_score
                    analysis.ats_feedback = sibling_analysis.ats_feedback
                    analysis.formatting_issues = sibling_analysis.formatting_issues
                    analysis.status = 'DONE'
                    analysis.error_message = None
                    analysis.analysed_at = timezone.now()
                    analysis.save()
                    logger.info(
                        f'Reused analysis for resume {resume_id} from sibling resume {sibling.id}'
                    )
                    return

        result = RESUME_ANALYZER.invoke({
            'resume_text': resume.raw_text,
            'analysis':    {},
            'error':       '',
        })

        if result.get('error'):
            raise ValueError(result['error'])

        data = result['analysis']
        analysis.skills_detected   = data['skills_detected']
        analysis.experience_years  = data['experience_years']
        analysis.strengths         = data['strengths']
        analysis.weaknesses        = data['weaknesses']
        analysis.ats_score         = data['ats_score']
        analysis.ats_feedback      = data['ats_feedback']
        analysis.formatting_issues = data['formatting_issues']
        analysis.status            = 'DONE'
        analysis.analysed_at       = timezone.now()
        analysis.save()

        logger.info(f'Resume analyzed [{resume_id}] — ATS: {data["ats_score"]}')

    except Exception as exc:
        try:
            resume = Resume.objects.get(id=resume_id)
            analysis, _ = ResumeAnalysis.objects.get_or_create(resume=resume)
            fallback = _fallback_resume_analysis(resume.raw_text)
            analysis.skills_detected = fallback['skills_detected']
            analysis.experience_years = fallback['experience_years']
            analysis.strengths = fallback['strengths']
            analysis.weaknesses = fallback['weaknesses']
            analysis.ats_score = fallback['ats_score']
            analysis.ats_feedback = fallback['ats_feedback']
            analysis.formatting_issues = fallback['formatting_issues']
            analysis.status = 'DONE'
            analysis.error_message = f'Primary AI analysis failed: {exc}'
            analysis.analysed_at = timezone.now()
            analysis.save()
            logger.warning(f'Resume analysis fallback used [{resume_id}]: {exc}')
            return
        except Exception:
            from ai_engine.models import ResumeAnalysis as RA
            RA.objects.filter(resume_id=resume_id).update(
                status='FAILED', error_message=str(exc)
            )
            logger.error(f'Resume analysis failed [{resume_id}]: {exc}')
            raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def analyze_jd_task(self, jd_id):
    from django.utils import timezone
    from job_descriptions.models import JDAnalysis, JobDescription
    from ai_engine.agents.jd_analyzer import JD_ANALYZER

    try:
        job_description = JobDescription.objects.get(id=jd_id)
        analysis, _ = JDAnalysis.objects.get_or_create(job_description=job_description)
        analysis.status = 'PROCESSING'
        analysis.error_message = None
        analysis.save(update_fields=['status', 'error_message'])

        result = JD_ANALYZER.invoke({
            'jd_text': job_description.raw_text,
            'analysis': {},
            'error': '',
        })

        if result.get('error'):
            raise ValueError(result['error'])

        data = result['analysis']
        analysis.required_skills = data.get('required_skills', [])
        analysis.nice_to_have_skills = data.get('nice_to_have_skills', [])
        analysis.seniority_level = data.get('seniority_level') or 'Unknown'
        analysis.company_type = data.get('company_type') or 'Unknown'
        analysis.key_responsibilities = data.get('key_responsibilities', [])
        analysis.years_of_experience = data.get('years_of_experience') or 0
        analysis.role_summary = data.get('role_summary', '')
        analysis.parsed_at = timezone.now()
        analysis.status = 'DONE'
        analysis.error_message = None
        analysis.save()

        logger.info(f'JD analyzed [{jd_id}] - {len(analysis.required_skills)} required skills')

        from applications.models import JobApplication
        for application_id in JobApplication.objects.filter(jd=job_description).values_list('id', flat=True):
            score_resume_task.delay(application_id)

    except Exception as exc:
        JDAnalysis.objects.filter(job_description_id=jd_id).update(
            status='FAILED',
            error_message=str(exc),
        )
        logger.error(f'JD analysis failed [{jd_id}]: {exc}')

        if 'too short' in str(exc).lower() or 'more complete' in str(exc).lower():
            return

        raise self.retry(exc=exc, countdown=30)


def _get_resume_chunks(resume, query_text, limit=6):
    try:
        import chromadb
        from chromadb.utils import embedding_functions
        from django.conf import settings

        client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name='BAAI/bge-small-en-v1.5'
        )
        collection = client.get_collection(
            name=f'resume_u{resume.user_id}_r{resume.id}',
            embedding_function=ef,
        )
        results = collection.query(query_texts=[query_text], n_results=limit)
        documents = results.get('documents') or []
        if documents and documents[0]:
            return documents[0]
    except Exception as exc:
        logger.warning(f'Chroma lookup failed for resume {resume.id}; falling back to raw text: {exc}')

    return [resume.raw_text[:5000]]


def _build_jd_context(application):
    if application.jd:
        analysis = getattr(application.jd, 'analysis', None)
        if analysis and analysis.status in {'PENDING', 'PROCESSING'}:
            raise RuntimeError('JD analysis is not ready yet.')
        if analysis and analysis.status == 'FAILED':
            raise ValueError(analysis.error_message or 'JD analysis failed.')

        required = analysis.required_skills if analysis else []
        nice = analysis.nice_to_have_skills if analysis else []
        responsibilities = analysis.key_responsibilities if analysis else []
        return {
            'text': application.jd.raw_text,
            'required_skills': required,
            'nice_to_have_skills': nice,
            'responsibilities': responsibilities,
        }

    return {
        'text': application.jd_raw_text,
        'required_skills': [],
        'nice_to_have_skills': [],
        'responsibilities': [],
    }


@shared_task(bind=True, max_retries=3)
def score_resume_task(self, application_id):
    from applications.models import JobApplication, ResumeScore
    from langchain_google_genai import ChatGoogleGenerativeAI
    from resumes.models import Resume
    from django.conf import settings

    score_record = None
    try:
        application = JobApplication.objects.select_related('jd', 'user').get(id=application_id)
        resume = Resume.objects.filter(
            user=application.user,
            is_active=True,
            parse_status='DONE',
            embedded_at__isnull=False,
        ).first()

        if not resume:
            if score_record:
                score_record.status = 'FAILED'
                score_record.error_message = "No active processed resume found for this user."
                score_record.save()
            logger.info(f'Skipping application score [{application_id}] - no active processed resume')
            return

        score_record = ResumeScore.objects.filter(
            application=application,
            resume=resume,
            status__in=['PENDING', 'PROCESSING'],
        ).first()
        if not score_record:
            score_record = ResumeScore.objects.create(
                application=application,
                resume=resume,
                status='PROCESSING',
            )
        else:
            score_record.status = 'PROCESSING'
            score_record.error_message = None
            score_record.save(update_fields=['status', 'error_message'])

        jd_context = _build_jd_context(application)
        jd_text = jd_context['text'].strip()
        if len(jd_text.split()) < 35:
            raise ValueError('Job description is too short to score reliably.')

        skill_query = ' '.join(
            jd_context['required_skills']
            + jd_context['nice_to_have_skills']
            + jd_context['responsibilities']
        ).strip() or jd_text[:1200]
        resume_chunks = _get_resume_chunks(resume, skill_query)

        llm = ChatGoogleGenerativeAI(
            model='gemini-3.1-flash-lite',
            temperature=0.1,
            google_api_key=settings.GOOGLE_API_KEY,
        ).with_structured_output(ResumeScoreOutput)

        prompt = f"""
You are an expert recruiter and ATS matcher. Score how well the resume matches the job.

JOB DESCRIPTION:
{jd_text[:6500]}

EXPLICIT REQUIRED SKILLS:
{jd_context['required_skills']}

EXPLICIT NICE-TO-HAVE SKILLS:
{jd_context['nice_to_have_skills']}

RELEVANT RESUME EXCERPTS:
{chr(10).join(resume_chunks)[:6500]}

Return:
- score: integer 0-100 for match quality
- confidence: integer 0-100 for how confident you are in the score
- matched_skills: skills clearly present in the resume and relevant to the JD
- missing_skills: JD skills not found in the resume excerpts
- summary: short paragraph explaining the score and biggest gaps
"""
        result = llm.invoke(prompt).model_dump()

        score_record.score = max(0, min(100, int(result.get('score', 0))))
        score_record.confidence = max(0, min(100, int(result.get('confidence', 0))))
        score_record.matched_skills = result.get('matched_skills', [])
        score_record.missing_skills = result.get('missing_skills', [])
        score_record.user_edited_missing = None
        score_record.summary = result.get('summary', '')
        score_record.scored_at = timezone.now()
        score_record.status = 'DONE'
        score_record.error_message = None
        score_record.save()

        logger.info(f'Resume scored [application={application_id}] - {score_record.score}')

    except RuntimeError as exc:
        if score_record:
            score_record.status = 'PENDING'
            score_record.error_message = str(exc)
            score_record.save(update_fields=['status', 'error_message'])
        raise self.retry(exc=exc, countdown=30)

    except Exception as exc:
        msg = str(exc)
        if 'RESOURCE_EXHAUSTED' in msg or '429' in msg:
            msg = "AI Quota Exceeded. The free-tier limit for the AI engine has been reached for today. Please try again later."
        
        if score_record:
            score_record.status = 'FAILED'
            score_record.error_message = msg
            score_record.save(update_fields=['status', 'error_message'])
        logger.error(f'Resume scoring failed [application={application_id}]: {exc}')

        if 'too short' in str(exc).lower() or 'analysis failed' in str(exc).lower():
            return

        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def recommend_jobs_task(self, resume_id, jd_id=None, recommendation_id=None):
    from ai_engine.agents.job_recommender import JOB_RECOMMENDER
    from ai_engine.models import JobRecommendation
    from resumes.models import Resume
    from job_descriptions.models import JobDescription

    record = None
    try:
        resume = Resume.objects.select_related('user').get(id=resume_id)
        if recommendation_id:
            record = JobRecommendation.objects.get(id=recommendation_id, resume__user=resume.user)
        else:
            record = JobRecommendation.objects.create(resume=resume, jd_id=jd_id, status='PENDING')

        record.status = 'PROCESSING'
        record.error_message = None
        record.save(update_fields=['status', 'error_message'])

        resume_analysis = getattr(resume, 'analysis', None)
        if not resume_analysis or resume_analysis.status != 'DONE':
            raise ValueError('Resume analysis is not ready. Analyze resume first.')

        jd_analysis_payload = None
        if jd_id:
            jd = JobDescription.objects.get(id=jd_id, user=resume.user)
            jd_analysis = getattr(jd, 'analysis', None)
            if jd_analysis and jd_analysis.status == 'DONE':
                jd_analysis_payload = {
                    'required_skills': jd_analysis.required_skills,
                    'nice_to_have_skills': jd_analysis.nice_to_have_skills,
                    'seniority_level': jd_analysis.seniority_level,
                    'company_type': jd_analysis.company_type,
                    'key_responsibilities': jd_analysis.key_responsibilities,
                    'years_of_experience': jd_analysis.years_of_experience,
                    'role_summary': jd_analysis.role_summary,
                }
            else:
                jd_analysis_payload = {
                    'raw_text': jd.raw_text[:4000],
                }

        result = JOB_RECOMMENDER.invoke({
            'resume_analysis': {
                'skills_detected': resume_analysis.skills_detected,
                'experience_years': resume_analysis.experience_years,
                'strengths': resume_analysis.strengths,
                'weaknesses': resume_analysis.weaknesses,
                'ats_score': resume_analysis.ats_score,
                'ats_feedback': resume_analysis.ats_feedback,
            },
            'jd_analysis': jd_analysis_payload,
            'recommendations': [],
            'error': '',
        })

        if result.get('error'):
            raise ValueError(result['error'])

        record.recommended_jobs = result.get('recommendations', [])
        record.generated_at = timezone.now()
        record.status = 'DONE'
        record.error_message = None
        record.save(update_fields=['recommended_jobs', 'generated_at', 'status', 'error_message'])
        logger.info(f'Generated recommendations [record={record.id}]')

    except Exception as exc:
        if record:
            record.status = 'FAILED'
            record.error_message = str(exc)
            record.save(update_fields=['status', 'error_message'])
        logger.error(f'Job recommendation failed [resume={resume_id}, jd={jd_id}]: {exc}')

        message = str(exc).lower()
        if 'analyze resume first' in message or 'exactly 5 recommendations' in message:
            return

        raise self.retry(exc=exc, countdown=30)


def _build_cv_final_content(approved_sections):
    ordered = [
        ('Professional Summary', approved_sections.get('summary', '').strip()),
        ('Experience', approved_sections.get('experience', '').strip()),
        ('Skills', approved_sections.get('skills', '').strip()),
        ('Cover Letter', approved_sections.get('cover_letter', '').strip()),
    ]
    parts = []
    for title, content in ordered:
        if content:
            parts.append(f'{title}\n{"=" * len(title)}\n{content}')
    return '\n\n'.join(parts).strip()


@shared_task(bind=True, max_retries=2)
def generate_cv_section_task(self, cv_generation_id, section):
    from ai_engine.agents.cv_generator import generate_cv_section
    from ai_engine.models import CVGeneration

    try:
        cv = CVGeneration.objects.select_related('resume', 'jd').get(id=cv_generation_id)
        if section not in CV_SECTIONS:
            raise ValueError('Invalid CV section.')

        resume_analysis = getattr(cv.resume, 'analysis', None)
        if not resume_analysis or resume_analysis.status != 'DONE':
            raise ValueError('Resume analysis must be complete before CV generation.')

        cv.status = 'PROCESSING'
        cv.current_checkpoint = section
        cv.error_message = None
        cv.save(update_fields=['status', 'current_checkpoint', 'error_message'])

        jd_analysis_payload = None
        jd_text = ''
        if cv.jd:
            jd_text = cv.jd.raw_text
            jd_analysis = getattr(cv.jd, 'analysis', None)
            if jd_analysis and jd_analysis.status == 'DONE':
                jd_analysis_payload = {
                    'required_skills': jd_analysis.required_skills,
                    'nice_to_have_skills': jd_analysis.nice_to_have_skills,
                    'seniority_level': jd_analysis.seniority_level,
                    'company_type': jd_analysis.company_type,
                    'key_responsibilities': jd_analysis.key_responsibilities,
                    'role_summary': jd_analysis.role_summary,
                }

        content = generate_cv_section(
            section=section,
            resume_text=cv.resume.raw_text,
            resume_analysis={
                'skills_detected': resume_analysis.skills_detected,
                'experience_years': resume_analysis.experience_years,
                'strengths': resume_analysis.strengths,
                'weaknesses': resume_analysis.weaknesses,
                'ats_score': resume_analysis.ats_score,
            },
            jd_text=jd_text,
            jd_analysis=jd_analysis_payload,
            approved_sections=cv.approved_sections,
        )

        if not content:
            raise ValueError('Generated section was empty.')

        cv.generated_content = content
        cv.status = 'AWAITING_REVIEW'
        cv.save(update_fields=['generated_content', 'status'])
        logger.info(f'Generated CV section [{cv_generation_id}] {section}')

    except Exception as exc:
        msg = str(exc)
        if 'RESOURCE_EXHAUSTED' in msg or '429' in msg:
            msg = "AI Quota Exceeded. The free-tier limit for the AI engine has been reached for today. Please try again later."
            
        CVGeneration.objects.filter(id=cv_generation_id).update(
            status='FAILED',
            error_message=msg,
        )
        message = str(exc).lower()
        if 'resume analysis must be complete' in message or 'invalid cv section' in message:
            return
        raise self.retry(exc=exc, countdown=20)


@shared_task(bind=True, max_retries=1)
def finalize_cv_generation_task(self, cv_generation_id):
    from ai_engine.models import CVGeneration

    try:
        cv = CVGeneration.objects.get(id=cv_generation_id)
        final_content = _build_cv_final_content(cv.approved_sections or {})
        if not final_content:
            raise ValueError('Cannot finalize CV without approved sections.')

        cv.final_content = final_content
        cv.generated_content = ''
        cv.current_checkpoint = 'done'
        cv.status = 'DONE'
        cv.completed_at = timezone.now()
        cv.error_message = None
        cv.save(update_fields=[
            'final_content',
            'generated_content',
            'current_checkpoint',
            'status',
            'completed_at',
            'error_message',
        ])
        logger.info(f'Finalized CV generation [{cv_generation_id}]')
    except Exception as exc:
        msg = str(exc)
        if 'RESOURCE_EXHAUSTED' in msg or '429' in msg:
            msg = "AI Quota Exceeded. The free-tier limit for the AI engine has been reached for today. Please try again later."
            
        from ai_engine.models import CVGeneration as CVG
        CVG.objects.filter(id=cv_generation_id).update(status='FAILED', error_message=msg)
        raise self.retry(exc=exc, countdown=20)


def _build_resume_profile_text(resume_generation):
    profile = resume_generation.profile_input or {}
    pieces = []

    if resume_generation.resume and resume_generation.resume.raw_text.strip():
        pieces.append('Existing Resume Text:')
        pieces.append(resume_generation.resume.raw_text.strip())

    fields = [
        ('Name', profile.get('name', '')),
        ('Email', profile.get('email', '')),
        ('Phone', profile.get('phone', '')),
        ('LinkedIn', profile.get('linkedin', '')),
        ('GitHub', profile.get('github', '')),
        ('Experience Description', profile.get('experience_description', '')),
    ]
    profile_lines = [f'{label}: {value}'.strip() for label, value in fields if str(value).strip()]
    if profile_lines:
        pieces.append('Candidate Inputs:')
        pieces.extend(profile_lines)

    return '\n'.join(pieces).strip()


def _build_resume_final_content(approved_sections, profile):
    header_lines = []
    name = (profile or {}).get('name', '').strip()
    if name:
        header_lines.append(name)
    contact_line = ' | '.join(
        [value.strip() for value in [
            (profile or {}).get('email', ''),
            (profile or {}).get('phone', ''),
            (profile or {}).get('linkedin', ''),
            (profile or {}).get('github', ''),
        ] if value and value.strip()]
    )
    if contact_line:
        header_lines.append(contact_line)

    ordered = [
        ('Professional Summary', approved_sections.get('summary', '').strip()),
        ('Work Experience', approved_sections.get('work_experience', '').strip()),
        ('Skills', approved_sections.get('skills', '').strip()),
        ('Education & Projects', approved_sections.get('education_projects', '').strip()),
    ]
    sections = []
    for title, content in ordered:
        if content:
            sections.append(f'{title}\n{"=" * len(title)}\n{content}')

    return '\n\n'.join([part for part in ['\n'.join(header_lines).strip(), '\n\n'.join(sections).strip()] if part]).strip()


@shared_task(bind=True, max_retries=2)
def generate_resume_section_task(self, resume_generation_id, section):
    from ai_engine.agents.resume_generator import generate_resume_section
    from ai_engine.models import ResumeGeneration

    try:
        run = ResumeGeneration.objects.select_related('resume', 'jd').get(id=resume_generation_id)
        if section not in RESUME_SECTIONS:
            raise ValueError('Invalid resume section.')

        base_profile_text = _build_resume_profile_text(run)
        if not base_profile_text:
            raise ValueError('Provide an existing resume or profile inputs to generate a resume.')

        run.status = 'PROCESSING'
        run.current_checkpoint = section
        run.error_message = None
        run.save(update_fields=['status', 'current_checkpoint', 'error_message'])

        resume_analysis_payload = None
        if run.resume:
            analysis = getattr(run.resume, 'analysis', None)
            if analysis and analysis.status == 'DONE':
                resume_analysis_payload = {
                    'skills_detected': analysis.skills_detected,
                    'experience_years': analysis.experience_years,
                    'strengths': analysis.strengths,
                    'weaknesses': analysis.weaknesses,
                    'ats_score': analysis.ats_score,
                    'ats_feedback': analysis.ats_feedback,
                }

        jd_analysis_payload = None
        jd_text = ''
        if run.jd:
            jd_text = run.jd.raw_text
            jd_analysis = getattr(run.jd, 'analysis', None)
            if jd_analysis and jd_analysis.status == 'DONE':
                jd_analysis_payload = {
                    'required_skills': jd_analysis.required_skills,
                    'nice_to_have_skills': jd_analysis.nice_to_have_skills,
                    'seniority_level': jd_analysis.seniority_level,
                    'company_type': jd_analysis.company_type,
                    'key_responsibilities': jd_analysis.key_responsibilities,
                    'role_summary': jd_analysis.role_summary,
                }

        content = generate_resume_section(
            section=section,
            base_profile_text=base_profile_text,
            resume_analysis=resume_analysis_payload,
            jd_text=jd_text,
            jd_analysis=jd_analysis_payload,
            approved_sections=run.approved_sections,
        )
        if not content:
            raise ValueError('Generated section was empty.')

        run.generated_content = content
        run.status = 'AWAITING_REVIEW'
        run.save(update_fields=['generated_content', 'status'])
        logger.info(f'Generated resume section [{resume_generation_id}] {section}')

    except Exception as exc:
        from ai_engine.models import ResumeGeneration as RG
        RG.objects.filter(id=resume_generation_id).update(status='FAILED', error_message=str(exc))
        message = str(exc).lower()
        if 'provide an existing resume or profile inputs' in message or 'invalid resume section' in message:
            return
        raise self.retry(exc=exc, countdown=20)


@shared_task(bind=True, max_retries=1)
def finalize_resume_generation_task(self, resume_generation_id):
    from ai_engine.models import ResumeGeneration

    try:
        run = ResumeGeneration.objects.get(id=resume_generation_id)
        final_content = _build_resume_final_content(run.approved_sections or {}, run.profile_input or {})
        if not final_content:
            raise ValueError('Cannot finalize resume without approved sections.')

        run.final_content = final_content
        run.generated_content = ''
        run.current_checkpoint = 'done'
        run.status = 'DONE'
        run.completed_at = timezone.now()
        run.error_message = None
        run.save(update_fields=[
            'final_content',
            'generated_content',
            'current_checkpoint',
            'status',
            'completed_at',
            'error_message',
        ])
        logger.info(f'Finalized resume generation [{resume_generation_id}]')
    except Exception as exc:
        from ai_engine.models import ResumeGeneration as RG
        RG.objects.filter(id=resume_generation_id).update(status='FAILED', error_message=str(exc))
        raise self.retry(exc=exc, countdown=20)


@shared_task(bind=True, max_retries=3)
def generate_interview_questions_task(self, jd_id: int, resume_id: int, user_id: int):
    """
    Generate categorised interview questions for a JD + resume combination.
    Reuses JD analysis data already extracted by the JD Analyzer agent.
    """
    from ai_engine.models import InterviewQuestions
    from ai_engine.agents.interview_agent import INTERVIEW_AGENT
    from job_descriptions.models import JobDescription
    from resumes.models import Resume
    from django.conf import settings

    # Get or create the record for this jd + user combination
    iq_obj, _ = InterviewQuestions.objects.get_or_create(
        jd_id=jd_id,
        user_id=user_id,
        defaults={'resume_id': resume_id, 'status': 'PENDING'}
    )

    # Guard: don't re-run if already processing
    if iq_obj.status == 'PROCESSING':
        logger.info(f'Interview questions already processing for JD {jd_id}, skipping')
        return

    try:
        iq_obj.status = 'PROCESSING'
        iq_obj.error_message = None
        iq_obj.resume_id = resume_id
        iq_obj.save(update_fields=['status', 'error_message', 'resume_id'])

        # Pull JD + its analysis (already parsed by JD Analyzer agent)
        jd = JobDescription.objects.select_related('analysis').get(id=jd_id)
        jd_analysis = getattr(jd, 'analysis', None)

        required_skills    = getattr(jd_analysis, 'required_skills', []) or []
        nice_to_have       = getattr(jd_analysis, 'nice_to_have_skills', []) or []
        responsibilities   = getattr(jd_analysis, 'key_responsibilities', []) or []
        seniority          = getattr(jd_analysis, 'seniority_level', 'Mid-level') or 'Mid-level'

        # Optional: pull resume summary text for richer, candidate-aware questions
        resume_summary = ''
        if resume_id:
            try:
                import chromadb
                from chromadb.utils import embedding_functions

                resume = Resume.objects.get(id=resume_id)
                client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
                ef = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name='BAAI/bge-small-en-v1.5'
                )
                collection = client.get_or_create_collection(
                    name=f'resume_u{user_id}_r{resume_id}',
                    embedding_function=ef
                )
                results = collection.query(
                    query_texts=[f'{jd.title} {" ".join(required_skills[:5])}'],
                    n_results=3
                )
                docs = results.get('documents', [[]])[0]
                resume_summary = ' '.join(docs[:3])
            except Exception as e:
                logger.warning(f'Could not fetch resume context for interview questions: {e}')
                resume_summary = ''

        # Run the LangGraph agent
        state = INTERVIEW_AGENT.invoke({
            'role_title': jd.title,
            'company_name': getattr(jd, 'company_name', ''),
            'required_skills': required_skills,
            'nice_to_have_skills': nice_to_have,
            'key_responsibilities': responsibilities,
            'seniority_level': seniority,
            'resume_summary': resume_summary,
            'result': {},
            'error': '',
        })

        if state.get('error'):
            raise ValueError(state['error'])

        result = state['result']
        iq_obj.technical_questions    = result.get('technical_questions', [])
        iq_obj.behavioral_questions   = result.get('behavioral_questions', [])
        iq_obj.role_specific_questions = result.get('role_specific_questions', [])
        iq_obj.status       = 'DONE'
        iq_obj.generated_at = timezone.now()
        iq_obj.save()

        total = (
            len(iq_obj.technical_questions) +
            len(iq_obj.behavioral_questions) +
            len(iq_obj.role_specific_questions)
        )
        logger.info(f'Interview questions generated — JD {jd_id}, total: {total}')

    except Exception as exc:
        msg = str(exc)
        if 'RESOURCE_EXHAUSTED' in msg or '429' in msg:
            msg = "AI Quota Exceeded. The free-tier limit for the AI engine has been reached for today. Please try again later."
            
        iq_obj.status = 'FAILED'
        iq_obj.error_message = msg
        iq_obj.save(update_fields=['status', 'error_message'])
        logger.error(f'Interview questions failed for JD {jd_id}: {exc}')
        raise self.retry(exc=exc, countdown=60)
