from django.urls import path

from . import views


urlpatterns = [
    path('', views.CVGenerationListCreateView.as_view()),
    path('<int:pk>/', views.CVGenerationDetailView.as_view()),
    path('<int:pk>/approve/', views.CVGenerationApproveView.as_view()),
    path('<int:pk>/regenerate/', views.CVGenerationRegenerateView.as_view()),
    path('<int:pk>/download/', views.CVGenerationDownloadView.as_view()),
]
