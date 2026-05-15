from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import JDAnalysis, JobDescription
from .serializers import JobDescriptionSerializer


def queue_jd_analysis(job_description):
    from ai_engine.tasks import analyze_jd_task

    analyze_jd_task.delay(job_description.id)


def reset_analysis(job_description):
    analysis, _ = JDAnalysis.objects.get_or_create(job_description=job_description)
    analysis.required_skills = []
    analysis.nice_to_have_skills = []
    analysis.seniority_level = ''
    analysis.company_type = ''
    analysis.key_responsibilities = []
    analysis.years_of_experience = 0
    analysis.role_summary = ''
    analysis.parsed_at = None
    analysis.status = 'PENDING'
    analysis.error_message = ''
    analysis.save()
    return analysis


class JobDescriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = JobDescriptionSerializer

    def get_queryset(self):
        return JobDescription.objects.filter(
            user=self.request.user,
            is_archived=False,
        )

    def perform_create(self, serializer):
        job_description = serializer.save(user=self.request.user)
        reset_analysis(job_description)
        queue_jd_analysis(job_description)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['include_resume_match'] = False
        return ctx


class JobDescriptionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = JobDescriptionSerializer

    def get_queryset(self):
        return JobDescription.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        previous = self.get_object()
        previous_values = {
            'title': previous.title,
            'company_name': previous.company_name,
            'raw_text': previous.raw_text,
            'source_url': previous.source_url,
        }
        job_description = serializer.save()

        if any(
            previous_values[key] != getattr(job_description, key)
            for key in previous_values
        ):
            reset_analysis(job_description)
            queue_jd_analysis(job_description)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['include_resume_match'] = True
        return ctx


class JobDescriptionReanalyzeView(APIView):
    def post(self, request, pk):
        try:
            job_description = JobDescription.objects.get(pk=pk, user=request.user)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        reset_analysis(job_description)
        queue_jd_analysis(job_description)
        return Response({'status': 'queued'})
