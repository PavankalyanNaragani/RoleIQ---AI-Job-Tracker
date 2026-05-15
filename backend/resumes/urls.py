from django.urls import path
from . import views

urlpatterns = [
    path('upload/',              views.ResumeUploadView.as_view()),
    path('',                     views.ResumeListView.as_view()),
    path('<int:pk>/',            views.ResumeDetailView.as_view()),
    path('<int:pk>/activate/',   views.ResumeActivateView.as_view()),
    path('<int:pk>/delete/',     views.ResumeDeleteView.as_view()),
    path('<int:pk>/reanalyze/',  views.ResumeReanalyzeView.as_view()),
]