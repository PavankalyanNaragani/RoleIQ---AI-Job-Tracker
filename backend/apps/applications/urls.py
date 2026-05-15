from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobApplicationViewSet, TagViewSet, ReminderViewSet,
    ResumeUploadView, ResumeListView, ResumeActivateView,
)

router = DefaultRouter()
router.register('applications', JobApplicationViewSet, basename='application')
router.register('tags', TagViewSet, basename='tag')
router.register('reminders', ReminderViewSet, basename='reminder')

urlpatterns = [
    path('', include(router.urls)),
    path('resume/upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('resume/', ResumeListView.as_view(), name='resume-list'),
    path('resume/<int:pk>/activate/', ResumeActivateView.as_view(), name='resume-activate'),
]