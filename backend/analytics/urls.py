from django.urls import path

from .views import (
    DashboardView,
    FunnelAnalyticsView,
    ResponseRateAnalyticsView,
    ScoreDistributionAnalyticsView,
    SkillGapsAnalyticsView,
    SourcesAnalyticsView,
    VelocityAnalyticsView,
)


urlpatterns = [
    path('', DashboardView.as_view()),
    path('funnel/', FunnelAnalyticsView.as_view()),
    path('velocity/', VelocityAnalyticsView.as_view()),
    path('skill-gaps/', SkillGapsAnalyticsView.as_view()),
    path('response-rate/', ResponseRateAnalyticsView.as_view()),
    path('sources/', SourcesAnalyticsView.as_view()),
    path('score-distribution/', ScoreDistributionAnalyticsView.as_view()),
]
