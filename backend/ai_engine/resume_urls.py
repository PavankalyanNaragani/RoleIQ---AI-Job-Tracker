from django.urls import path

from . import views


urlpatterns = [
    path('', views.ResumeGenerationListCreateView.as_view()),
    path('<int:pk>/', views.ResumeGenerationDetailView.as_view()),
    path('<int:pk>/approve/', views.ResumeGenerationApproveView.as_view()),
    path('<int:pk>/regenerate/', views.ResumeGenerationRegenerateView.as_view()),
    path('<int:pk>/download/', views.ResumeGenerationDownloadView.as_view()),
]
