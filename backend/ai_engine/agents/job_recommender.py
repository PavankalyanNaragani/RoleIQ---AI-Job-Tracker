from typing import List, Optional, TypedDict

from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    title: str
    company_type: str
    match_score: int = Field(ge=0, le=100)
    match_reason: str
    key_skills_to_highlight: List[str] = Field(default_factory=list)
    skill_gaps_to_address: List[str] = Field(default_factory=list)
    suggested_search_query: str


class RecommendationsOutput(BaseModel):
    recommendations: List[RecommendationItem]


class RecommenderState(TypedDict):
    resume_analysis: dict
    jd_analysis: Optional[dict]
    recommendations: List[dict]
    error: str


def recommend_node(state: RecommenderState) -> RecommenderState:
    llm = ChatGoogleGenerativeAI(
        model='gemini-2.5-flash',
        temperature=0.2,
        thinking_budget=0,
        google_api_key=settings.GOOGLE_API_KEY,
    ).with_structured_output(RecommendationsOutput)

    prompt = f"""
You are a career advisor for software professionals.
Create exactly 5 job recommendations tailored to the candidate profile.

CANDIDATE RESUME ANALYSIS:
{state['resume_analysis']}

OPTIONAL JOB DESCRIPTION CONTEXT (may be null):
{state['jd_analysis']}

Rules:
- Return exactly 5 recommendations.
- Keep roles realistic for the candidate's inferred level.
- Use company_type values like Startup, Product, MNC, Service.
- Each match_reason should be concise (1-2 lines).
- key_skills_to_highlight should focus on strengths already present.
- skill_gaps_to_address should be concrete and learnable.
- suggested_search_query should be ready to paste into LinkedIn/Naukri search.
"""
    result = llm.invoke(prompt)
    return {
        **state,
        'recommendations': [item.model_dump() for item in result.recommendations[:5]],
    }


def validate_node(state: RecommenderState) -> RecommenderState:
    items = state.get('recommendations') or []
    if len(items) != 5:
        return {**state, 'error': 'Model did not return exactly 5 recommendations.'}
    return state


def build_recommender():
    graph = StateGraph(RecommenderState)
    graph.add_node('recommend', recommend_node)
    graph.add_node('validate', validate_node)
    graph.set_entry_point('recommend')
    graph.add_edge('recommend', 'validate')
    graph.add_edge('validate', END)
    return graph.compile()


JOB_RECOMMENDER = build_recommender()
