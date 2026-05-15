from django.urls import path

from . import views


urlpatterns = [
    path('', views.JobDescriptionListCreateView.as_view()),
    path('<int:pk>/', views.JobDescriptionDetailView.as_view()),
    path('<int:pk>/reanalyze/', views.JobDescriptionReanalyzeView.as_view()),
]
