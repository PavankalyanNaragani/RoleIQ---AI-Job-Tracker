from typing import List, Optional, TypedDict

from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field


class JDAnalysisOutput(BaseModel):
    required_skills: List[str] = Field(default_factory=list)
    nice_to_have_skills: List[str] = Field(default_factory=list)
    seniority_level: str = 'Unknown'
    company_type: str = 'Unknown'
    key_responsibilities: List[str] = Field(default_factory=list)
    years_of_experience: Optional[int] = None
    role_summary: str = ''


class JDState(TypedDict):
    jd_text: str
    analysis: dict
    error: str


def parse_node(state: JDState) -> JDState:
    jd_text = state['jd_text'].strip()
    if len(jd_text.split()) < 35:
        return {
            **state,
            'error': 'Job description is too short to analyze reliably. Paste the full role description.',
        }

    llm = ChatGoogleGenerativeAI(
        model='gemini-3.1-flash-lite',
        temperature=0.1,
        google_api_key=settings.GOOGLE_API_KEY,
    ).with_structured_output(JDAnalysisOutput)

    prompt = f"""
You are an expert job description parser. Extract structured fields from the job description below.

JOB DESCRIPTION:
{jd_text[:8000]}

Rules:
- Only include skills that are explicitly mentioned in the JD. Do not infer hidden skills.
- Split must-have skills into required_skills and optional/preferred skills into nice_to_have_skills.
- seniority_level must be one of: Junior, Mid, Senior, Lead, Unknown.
- company_type must be one of: Startup, MNC, Product, Service, Unknown.
- years_of_experience should be the minimum explicit years requested, or null if none is mentioned.
- key_responsibilities should contain concrete duties from the role, not generic career advice.
- role_summary must be one concise sentence.
"""
    result = llm.invoke(prompt)
    return {**state, 'analysis': result.model_dump()}


def validate_node(state: JDState) -> JDState:
    if state.get('error'):
        return state

    analysis = state.get('analysis') or {}
    has_skills = analysis.get('required_skills') or analysis.get('nice_to_have_skills')
    has_responsibilities = analysis.get('key_responsibilities')

    if not has_skills and not has_responsibilities:
        return {
            **state,
            'error': 'No skills or responsibilities were detected. Paste a more complete job description.',
        }

    return state


def build_jd_analyzer():
    graph = StateGraph(JDState)
    graph.add_node('parse', parse_node)
    graph.add_node('validate', validate_node)
    graph.set_entry_point('parse')
    graph.add_edge('parse', 'validate')
    graph.add_edge('validate', END)
    return graph.compile()


JD_ANALYZER = build_jd_analyzer()
