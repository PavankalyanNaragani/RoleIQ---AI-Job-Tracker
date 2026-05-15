from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI


SECTION_PROMPTS = {
    'summary': (
        "Write an ATS-optimized professional summary (4-6 lines). "
        "Focus on measurable impact and role relevance."
    ),
    'work_experience': (
        "Write a work experience section with concise bullet points and quantified outcomes. "
        "Keep chronology clear and ATS-friendly."
    ),
    'skills': (
        "Write a skills section grouped by relevance (for example: Languages, Frameworks, Tools, Cloud). "
        "Use plain text and avoid decorative formatting."
    ),
    'education_projects': (
        "Write education and projects sections suitable for an ATS resume. "
        "Highlight practical impact and technologies used."
    ),
}


def generate_resume_section(
    section,
    base_profile_text,
    resume_analysis=None,
    jd_text='',
    jd_analysis=None,
    approved_sections=None,
):
    resume_analysis = resume_analysis or {}
    jd_analysis = jd_analysis or {}
    approved_sections = approved_sections or {}

    llm = ChatGoogleGenerativeAI(
        model='gemini-3.1-flash-lite',
        temperature=0.3,
        google_api_key=settings.GOOGLE_API_KEY,
    )

    prompt = f"""
You are an expert ATS resume writer. Generate only the requested section.

SECTION TO GENERATE: {section}
SECTION GUIDANCE:
{SECTION_PROMPTS.get(section, 'Generate a polished ATS resume section.')}

BASE CANDIDATE PROFILE:
{base_profile_text[:7000]}

RESUME ANALYSIS (OPTIONAL):
{resume_analysis}

OPTIONAL JD RAW TEXT:
{(jd_text or '')[:4000]}

OPTIONAL JD ANALYSIS:
{jd_analysis}

ALREADY APPROVED SECTIONS:
{approved_sections}

Rules:
- Return plain text for this section only.
- Keep output ATS-friendly: no tables, no columns, no markdown.
- Use realistic claims based on provided profile only.
"""

    response = llm.invoke(prompt)
    res_text = response.content
    if isinstance(res_text, list):
        res_text = "\n".join([str(p) for p in res_text])
    return (res_text or '').strip()
