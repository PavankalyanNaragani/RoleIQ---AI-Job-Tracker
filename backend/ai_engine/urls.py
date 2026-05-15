from django.urls import path, include
from ai_engine import views

urlpatterns = [
    path('recommendations/', views.JobRecommendationListCreateView.as_view(), name='recommendation-list'),
    path('recommendations/<int:pk>/', views.JobRecommendationDetailView.as_view(), name='recommendation-detail'),
    path('recommendations/<int:pk>/retry/', views.JobRecommendationRetryView.as_view(), name='recommendation-retry'),
    path('cv/', include('ai_engine.cv_urls')),
    path('resumes/', include('ai_engine.resume_urls')),

    # ── Pipeline endpoints ────────────────────────────────────────────────────
    path('pipeline/<int:jd_id>/run/', views.PipelineRunView.as_view(), name='pipeline-run'),
    path('pipeline/<int:jd_id>/status/', views.PipelineStatusView.as_view(), name='pipeline-status'),
]
