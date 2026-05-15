from django.http import HttpResponse
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_engine.models import CVGeneration, JobRecommendation, ResumeGeneration
from ai_engine.serializers import CVGenerationSerializer, JobRecommendationSerializer, ResumeGenerationSerializer
from ai_engine.tasks import (
    CV_SECTIONS,
    RESUME_SECTIONS,
    finalize_cv_generation_task,
    finalize_resume_generation_task,
    generate_cv_section_task,
    generate_resume_section_task,
    recommend_jobs_task,
)


class JobRecommendationListCreateView(generics.ListCreateAPIView):
    serializer_class = JobRecommendationSerializer

    def get_queryset(self):
        queryset = JobRecommendation.objects.filter(resume__user=self.request.user).select_related('resume', 'jd')
        resume_id = self.request.query_params.get('resume_id')
        if resume_id:
            queryset = queryset.filter(resume_id=resume_id)
        return queryset

    def perform_create(self, serializer):
        recommendation = serializer.save(status='PENDING')
        recommend_jobs_task.delay(
            recommendation.resume_id,
            recommendation.jd_id,
            recommendation.id,
        )


class JobRecommendationDetailView(generics.RetrieveAPIView):
    serializer_class = JobRecommendationSerializer

    def get_queryset(self):
        return JobRecommendation.objects.filter(resume__user=self.request.user).select_related('resume', 'jd')


class JobRecommendationRetryView(APIView):
    def post(self, request, pk):
        try:
            recommendation = JobRecommendation.objects.select_related('resume').get(pk=pk, resume__user=request.user)
        except JobRecommendation.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        recommendation.status = 'PENDING'
        recommendation.error_message = None
        recommendation.save(update_fields=['status', 'error_message'])
        recommend_jobs_task.delay(recommendation.resume_id, recommendation.jd_id, recommendation.id)
        return Response({'status': 'queued'})


class CVGenerationListCreateView(generics.ListCreateAPIView):
    serializer_class = CVGenerationSerializer

    def get_queryset(self):
        return CVGeneration.objects.filter(user=self.request.user).select_related('resume', 'jd')

    def perform_create(self, serializer):
        cv = serializer.save(user=self.request.user, status='PENDING', current_checkpoint='summary')
        generate_cv_section_task.delay(cv.id, 'summary')


class CVGenerationDetailView(generics.RetrieveAPIView):
    serializer_class = CVGenerationSerializer

    def get_queryset(self):
        return CVGeneration.objects.filter(user=self.request.user).select_related('resume', 'jd')


class CVGenerationApproveView(APIView):
    def post(self, request, pk):
        try:
            cv = CVGeneration.objects.get(pk=pk, user=request.user)
        except CVGeneration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if cv.status != 'AWAITING_REVIEW':
            return Response({'error': 'CV is not awaiting review.'}, status=400)

        section = request.data.get('section', '').strip()
        content = request.data.get('content', '').strip()
        if section != cv.current_checkpoint:
            return Response({'error': 'Section does not match current checkpoint.'}, status=400)
        if not content:
            return Response({'error': 'Content cannot be empty.'}, status=400)

        approved = dict(cv.approved_sections or {})
        approved[section] = content
        cv.approved_sections = approved
        cv.generated_content = ''
        cv.error_message = None
        cv.save(update_fields=['approved_sections', 'generated_content', 'error_message'])

        current_index = CV_SECTIONS.index(section) if section in CV_SECTIONS else -1
        has_next = current_index >= 0 and current_index < len(CV_SECTIONS) - 1
        if has_next:
            next_section = CV_SECTIONS[current_index + 1]
            cv.status = 'PROCESSING'
            cv.current_checkpoint = next_section
            cv.save(update_fields=['status', 'current_checkpoint'])
            generate_cv_section_task.delay(cv.id, next_section)
        else:
            cv.status = 'PROCESSING'
            cv.current_checkpoint = 'finalizing'
            cv.save(update_fields=['status', 'current_checkpoint'])
            finalize_cv_generation_task.delay(cv.id)

        return Response(CVGenerationSerializer(cv, context={'request': request}).data)


class CVGenerationRegenerateView(APIView):
    def post(self, request, pk):
        try:
            cv = CVGeneration.objects.get(pk=pk, user=request.user)
        except CVGeneration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if cv.current_checkpoint not in CV_SECTIONS:
            return Response({'error': 'No active section to regenerate.'}, status=400)

        cv.status = 'PROCESSING'
        cv.error_message = None
        cv.save(update_fields=['status', 'error_message'])
        generate_cv_section_task.delay(cv.id, cv.current_checkpoint)
        return Response({'status': 'queued'})


class CVGenerationDownloadView(APIView):
    def get(self, request, pk):
        try:
            cv = CVGeneration.objects.get(pk=pk, user=request.user)
        except CVGeneration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if cv.status != 'DONE' or not cv.final_content.strip():
            return Response({'error': 'CV is not ready for download.'}, status=400)

        filename = f'cv_generation_{cv.id}.txt'
        response = HttpResponse(cv.final_content, content_type='text/plain; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ResumeGenerationListCreateView(generics.ListCreateAPIView):
    serializer_class = ResumeGenerationSerializer

    def get_queryset(self):
        return ResumeGeneration.objects.filter(user=self.request.user).select_related('resume', 'jd')

    def perform_create(self, serializer):
        run = serializer.save(user=self.request.user, status='PENDING', current_checkpoint='summary')
        generate_resume_section_task.delay(run.id, 'summary')


class ResumeGenerationDetailView(generics.RetrieveAPIView):
    serializer_class = ResumeGenerationSerializer

    def get_queryset(self):
        return ResumeGeneration.objects.filter(user=self.request.user).select_related('resume', 'jd')


class ResumeGenerationApproveView(APIView):
    def post(self, request, pk):
        try:
            run = ResumeGeneration.objects.get(pk=pk, user=request.user)
        except ResumeGeneration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if run.status != 'AWAITING_REVIEW':
            return Response({'error': 'Resume is not awaiting review.'}, status=400)

        section = request.data.get('section', '').strip()
        content = request.data.get('content', '').strip()
        if section != run.current_checkpoint:
            return Response({'error': 'Section does not match current checkpoint.'}, status=400)
        if not content:
            return Response({'error': 'Content cannot be empty.'}, status=400)

        approved = dict(run.approved_sections or {})
        approved[section] = content
        run.approved_sections = approved
        run.generated_content = ''
        run.error_message = None
        run.save(update_fields=['approved_sections', 'generated_content', 'error_message'])

        current_index = RESUME_SECTIONS.index(section) if section in RESUME_SECTIONS else -1
        has_next = current_index >= 0 and current_index < len(RESUME_SECTIONS) - 1
        if has_next:
            next_section = RESUME_SECTIONS[current_index + 1]
            run.status = 'PROCESSING'
            run.current_checkpoint = next_section
            run.save(update_fields=['status', 'current_checkpoint'])
            generate_resume_section_task.delay(run.id, next_section)
        else:
            run.status = 'PROCESSING'
            run.current_checkpoint = 'finalizing'
            run.save(update_fields=['status', 'current_checkpoint'])
            finalize_resume_generation_task.delay(run.id)

        return Response(ResumeGenerationSerializer(run, context={'request': request}).data)


class ResumeGenerationRegenerateView(APIView):
    def post(self, request, pk):
        try:
            run = ResumeGeneration.objects.get(pk=pk, user=request.user)
        except ResumeGeneration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if run.current_checkpoint not in RESUME_SECTIONS:
            return Response({'error': 'No active section to regenerate.'}, status=400)

        run.status = 'PROCESSING'
        run.error_message = None
        run.save(update_fields=['status', 'error_message'])
        generate_resume_section_task.delay(run.id, run.current_checkpoint)
        return Response({'status': 'queued'})


class ResumeGenerationDownloadView(APIView):
    def get(self, request, pk):
        try:
            run = ResumeGeneration.objects.get(pk=pk, user=request.user)
        except ResumeGeneration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if run.status != 'DONE' or not run.final_content.strip():
            return Response({'error': 'Resume is not ready for download.'}, status=400)

# ── Pipeline Orchestration Views ─────────────────────────────────────────────

from rest_framework.permissions import IsAuthenticated
from ai_engine.models import InterviewQuestions
from job_descriptions.models import JDAnalysis
from applications.models import ResumeScore


class PipelineRunView(APIView):
    """
    POST /api/ai/pipeline/:jd_id/run/
    
    Triggers the full AI pipeline for a given JD + resume:
      1. CV Generation
      2. Resume Generation
      3. Interview Qs
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, jd_id):
        from job_descriptions.models import JobDescription
        from resumes.models import Resume
        from ai_engine.models import CVGeneration, ResumeGeneration
        from ai_engine.tasks import (
            generate_cv_section_task,
            generate_resume_section_task,
            generate_interview_questions_task,
        )

        try:
            jd = JobDescription.objects.get(id=jd_id, user=request.user)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Job description not found.'}, status=404)

        resume_id = request.data.get('resume_id')
        if not resume_id:
            return Response({'error': 'resume_id is required.'}, status=400)

        try:
            resume = Resume.objects.get(id=resume_id, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found.'}, status=404)

        # ── Ensure JobApplication exists for matching ────────────────────────
        from applications.models import JobApplication
        application, _ = JobApplication.objects.get_or_create(
            jd=jd,
            user=request.user,
            defaults={
                'company_name': jd.company_name,
                'role_title': jd.title,
                'status': 'APPLIED',
            }
        )

        # ── Set Selected Resume as Active ────────────────────────────────────
        # score_resume_task currently targets the active resume
        Resume.objects.filter(user=request.user).update(is_active=False)
        resume.is_active = True
        resume.save()

        # ── Resume Match (Agent 2): create/reset ─────────────────────────────
        from applications.models import ResumeScore
        score_record, _ = ResumeScore.objects.get_or_create(
            application=application,
            resume=resume,
            defaults={'status': 'PENDING'}
        )
        score_record.status = 'PENDING'
        score_record.error_message = None
        score_record.save()

        # ── CV Generation (Agent 3): create/reset ────────────────────────────
        cv_run, _ = CVGeneration.objects.get_or_create(
            jd=jd,
            user=request.user,
            defaults={'resume': resume, 'status': 'PENDING'}
        )
        cv_run.resume = resume
        cv_run.status = 'PENDING'
        cv_run.current_checkpoint = 'summary'
        cv_run.error_message = None
        cv_run.approved_sections = {}
        cv_run.final_content = ''
        cv_run.save()

        # ── Resume Generation: create/reset run ───────────────────────────────
        resume_run, _ = ResumeGeneration.objects.get_or_create(
            jd=jd,
            user=request.user,
            defaults={'resume': resume, 'status': 'PENDING'}
        )
        resume_run.resume = resume
        resume_run.status = 'PENDING'
        resume_run.current_checkpoint = 'summary'
        resume_run.error_message = None
        resume_run.approved_sections = {}
        resume_run.final_content = ''
        resume_run.save()

        # ── Interview Questions: create/reset ─────────────────────────────────
        iq_obj, _ = InterviewQuestions.objects.get_or_create(
            jd=jd,
            user=request.user,
            defaults={'resume': resume, 'status': 'PENDING'}
        )
        iq_obj.resume = resume
        iq_obj.status = 'PENDING'
        iq_obj.error_message = None
        iq_obj.technical_questions = []
        iq_obj.behavioral_questions = []
        iq_obj.role_specific_questions = []
        iq_obj.save()

        # ── Enqueue all tasks (run in parallel via Celery) ────────────────────
        from ai_engine.tasks import score_resume_task
        
        score_resume_task.delay(application.id)
        generate_cv_section_task.delay(cv_run.id, 'summary')
        generate_resume_section_task.delay(resume_run.id, 'summary')
        generate_interview_questions_task.delay(jd_id, resume_id, request.user.id)

        return Response({
            'status': 'queued',
            'jd_id': jd_id,
            'resume_id': resume_id,
            'cv_run_id': cv_run.id,
            'resume_run_id': resume_run.id,
        }, status=202)


class PipelineStatusView(APIView):
    """
    GET /api/ai/pipeline/:jd_id/status/
    
    Returns the live status of all pipeline steps for a JD.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, jd_id):
        from job_descriptions.models import JobDescription, JDAnalysis
        from ai_engine.models import (
            CVGeneration, ResumeGeneration, InterviewQuestions,
        )
        from applications.models import ResumeScore

        try:
            jd = JobDescription.objects.get(id=jd_id, user=request.user)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Job description not found.'}, status=404)

        def get_status(Model, **filters):
            try:
                # Use order_by('-id') if created_at is not available or to be safe
                obj = Model.objects.filter(**filters).latest('id')
                return {
                    'status': obj.status,
                    'error_message': getattr(obj, 'error_message', None),
                    'id': obj.id,
                }
            except Model.DoesNotExist:
                return {'status': 'NOT_STARTED', 'error_message': None, 'id': None}

        # Step 1a: JD Analysis
        jd_analysis_status = get_status(JDAnalysis, job_description=jd)

        # Step 1b: Resume Score (via JobApplication)
        resume_score_status = get_status(ResumeScore, application__jd=jd, application__user=request.user)

        # Step 2: CV Generation
        cv_status = get_status(CVGeneration, jd=jd, user=request.user)
        cv_data = None
        if cv_status['status'] == 'DONE' and cv_status['id']:
            cv_run = CVGeneration.objects.get(id=cv_status['id'])
            cv_data = cv_run.final_content

        # Step 3: Resume Generation
        resume_status = get_status(ResumeGeneration, jd=jd, user=request.user)
        resume_data = None
        if resume_status['status'] == 'DONE' and resume_status['id']:
            resume_run = ResumeGeneration.objects.get(id=resume_status['id'])
            resume_data = resume_run.final_content

        # Step 4: Interview Questions
        iq_status = get_status(InterviewQuestions, jd=jd, user=request.user)
        iq_data = None
        if iq_status['status'] == 'DONE' and iq_status['id']:
            iq = InterviewQuestions.objects.get(id=iq_status['id'])
            iq_data = {
                'technical': iq.technical_questions,
                'behavioral': iq.behavioral_questions,
                'role_specific': iq.role_specific_questions,
            }

        return Response({
            'jd_id': jd_id,
            'steps': {
                'jd_analysis':     {**jd_analysis_status},
                'resume_score':    {**resume_score_status},
                'cv_generation':   {**cv_status,     'data': cv_data},
                'resume_generation': {**resume_status, 'data': resume_data},
                'interview_questions': {**iq_status,  'data': iq_data},
            }
        })
