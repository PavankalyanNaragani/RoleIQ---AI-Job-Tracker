from django.urls import path

from . import views


urlpatterns = [
    path('', views.JobApplicationListCreateView.as_view()),
    path('<int:pk>/', views.JobApplicationDetailView.as_view()),
    path('<int:pk>/status/', views.JobApplicationStatusView.as_view()),
    path('<int:pk>/rescore/', views.JobApplicationRescoreView.as_view()),
    path('<int:pk>/missing-skills/', views.JobApplicationMissingSkillsView.as_view()),
]
