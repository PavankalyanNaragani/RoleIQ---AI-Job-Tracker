from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/dashboard/', include('analytics.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/resumes/', include('resumes.urls')),
    path('api/job-descriptions/', include('job_descriptions.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/ai/', include('ai_engine.urls')),
    path('api/cv-generation/', include('ai_engine.cv_urls')),
    path('api/resume-generation/', include('ai_engine.resume_urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
