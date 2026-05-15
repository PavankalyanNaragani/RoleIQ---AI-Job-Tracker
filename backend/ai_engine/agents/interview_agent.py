import logging
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel

logger = logging.getLogger('ai_engine')


class InterviewQuestionsOutput(BaseModel):
    technical_questions: List[str]
    behavioral_questions: List[str]
    role_specific_questions: List[str]


class InterviewState(TypedDict):
    role_title: str
    company_name: str
    required_skills: List[str]
    nice_to_have_skills: List[str]
    key_responsibilities: List[str]
    seniority_level: str
    resume_summary: str          # optional context from resume
    result: dict
    error: str


def generate_questions_node(state: InterviewState) -> InterviewState:
    """Core node: generate categorised interview questions using Gemini."""
    try:
        from django.conf import settings
        llm = ChatGoogleGenerativeAI(
            model='gemini-3.1-flash-lite',
            temperature=0.7,
            google_api_key=settings.GOOGLE_API_KEY,
        ).with_structured_output(InterviewQuestionsOutput)

        prompt = ChatPromptTemplate.from_messages([
            ('system', """You are a senior technical interviewer with 15+ years of experience.
Generate realistic, role-specific interview questions for the given job.

Rules:
- Technical questions: test depth of knowledge in required skills (5-6 questions)
- Behavioral questions: STAR-format situations relevant to the role (4-5 questions)  
- Role-specific questions: specific to this company/domain/seniority (4-5 questions)
- Questions should be open-ended and thought-provoking
- Vary difficulty — include some easy warmup and some hard deep-dives
- Do NOT generate generic questions like "Tell me about yourself"
"""),
            ('human', """Generate interview questions for this role:

Role: {role_title}
Company: {company_name}
Seniority: {seniority_level}
Required Skills: {required_skills}
Nice-to-have Skills: {nice_to_have_skills}
Key Responsibilities: {key_responsibilities}
Candidate Resume Summary: {resume_summary}
""")
        ])

        chain = prompt | llm
        result = chain.invoke({
            'role_title': state['role_title'],
            'company_name': state.get('company_name', 'the company'),
            'seniority_level': state.get('seniority_level', 'Mid-level'),
            'required_skills': ', '.join(state.get('required_skills', [])),
            'nice_to_have_skills': ', '.join(state.get('nice_to_have_skills', [])),
            'key_responsibilities': ', '.join(state.get('key_responsibilities', [])[:5]),
            'resume_summary': state.get('resume_summary', 'Not provided'),
        })

        return {**state, 'result': result.model_dump(), 'error': ''}

    except Exception as e:
        logger.error(f'Interview question generation failed: {e}')
        return {**state, 'result': {}, 'error': str(e)}


def validate_node(state: InterviewState) -> InterviewState:
    """Validate that we got meaningful output."""
    result = state.get('result', {})
    total = (
        len(result.get('technical_questions', [])) +
        len(result.get('behavioral_questions', [])) +
        len(result.get('role_specific_questions', []))
    )
    if total < 5:
        return {**state, 'error': 'Generated too few questions — retrying may help'}
    return state


def build_interview_agent():
    graph = StateGraph(InterviewState)
    graph.add_node('generate', generate_questions_node)
    graph.add_node('validate', validate_node)
    graph.set_entry_point('generate')
    graph.add_edge('generate', 'validate')
    graph.add_edge('validate', END)
    return graph.compile()


INTERVIEW_AGENT = build_interview_agent()
