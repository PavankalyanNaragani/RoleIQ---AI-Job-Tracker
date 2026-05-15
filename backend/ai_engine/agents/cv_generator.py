from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI


SECTION_PROMPTS = {
    'summary': (
        "Write a professional resume summary tailored to the target role. "
        "Keep it concise (4-6 lines), results-focused, and ATS-friendly."
    ),
    'experience': (
        "Write a work experience section with strong action verbs and quantified impact where possible. "
        "Use concise bullet points."
    ),
    'skills': (
        "Write a clean skills section grouped logically (for example: Languages, Frameworks, Tools, Cloud). "
        "Keep only relevant skills for the role."
    ),
    'cover_letter': (
        "Write a short, tailored cover letter (3 short paragraphs) aligned to the role and company context."
    ),
}


def generate_cv_section(section, resume_text, resume_analysis, jd_text='', jd_analysis=None, approved_sections=None):
    approved_sections = approved_sections or {}
    jd_analysis = jd_analysis or {}

    llm = ChatGoogleGenerativeAI(
        model='gemini-3.1-flash-lite',
        temperature=0.3,
        google_api_key=settings.GOOGLE_API_KEY,
    )

    prompt = f"""
You are an expert career writer. Generate only the requested section.

SECTION TO GENERATE: {section}
SECTION GUIDANCE:
{SECTION_PROMPTS.get(section, 'Generate a polished section aligned to the role.')}

RESUME RAW TEXT:
{resume_text[:6500]}

RESUME ANALYSIS:
{resume_analysis}

OPTIONAL JD RAW TEXT:
{(jd_text or '')[:4500]}

OPTIONAL JD ANALYSIS:
{jd_analysis}

ALREADY APPROVED SECTIONS:
{approved_sections}

Rules:
- Return plain text for the requested section only.
- Do not add markdown fences.
- Keep content ATS-friendly and realistic to the candidate profile.
"""

    response = llm.invoke(prompt)
    res_text = response.content
    if isinstance(res_text, list):
        res_text = "\n".join([str(p) for p in res_text])
    return (res_text or '').strip()
