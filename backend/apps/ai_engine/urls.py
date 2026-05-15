from django.urls import path
from .views import (
    FunnelView, VelocityView, SkillGapsView,
    ResponseRateView, SourceBreakdownView, ScoreDistributionView,
)

urlpatterns = [
    path('funnel/', FunnelView.as_view()),
    path('velocity/', VelocityView.as_view()),
    path('skill-gaps/', SkillGapsView.as_view()),
    path('response-rate/', ResponseRateView.as_view()),
    path('sources/', SourceBreakdownView.as_view()),
    path('score-distribution/', ScoreDistributionView.as_view()),
]