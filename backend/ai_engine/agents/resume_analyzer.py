from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from typing import List, TypedDict
from django.conf import settings


class ResumeAnalysisOutput(BaseModel):
    skills_detected:   List[str]
    experience_years:  int
    strengths:         List[str]
    weaknesses:        List[str]
    ats_score:         int
    ats_feedback:      str
    formatting_issues: List[str]


class ResumeState(TypedDict):
    resume_text: str
    analysis:    dict
    error:       str


def analyze_node(state: ResumeState) -> ResumeState:
    llm = ChatGoogleGenerativeAI(
        model='gemini-3.1-flash-lite',
        temperature=0,
        google_api_key=settings.GOOGLE_API_KEY,
    ).with_structured_output(ResumeAnalysisOutput)

    prompt = f"""
You are an expert ATS and resume analyst. Analyze the resume below carefully.

RESUME TEXT:
{state['resume_text'][:6000]}

Instructions:
- List every technical and soft skill explicitly mentioned
- Estimate total years of professional experience
- Identify 3–5 concrete strengths (be specific, not generic)
- Identify 3–5 actionable weaknesses or improvement areas
- Give an ATS score (0–100) based on: keyword density, formatting clarity,
  quantified results, completeness of sections, and readability
- Flag formatting issues that ATS systems struggle with
  (e.g. tables, columns, images, non-standard headings, headers/footers)
"""
    result = llm.invoke(prompt)
    return {**state, 'analysis': result.model_dump()}


def validate_node(state: ResumeState) -> ResumeState:
    if not state['analysis'].get('skills_detected'):
        return {**state, 'error': 'No skills detected — resume may be empty or unreadable.'}
    return state


def build_resume_analyzer():
    g = StateGraph(ResumeState)
    g.add_node('analyze',  analyze_node)
    g.add_node('validate', validate_node)
    g.set_entry_point('analyze')
    g.add_edge('analyze',  'validate')
    g.add_edge('validate', END)
    return g.compile()


RESUME_ANALYZER = build_resume_analyzer()
