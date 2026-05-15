from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import JobApplication, ResumeScore
from .serializers import JobApplicationSerializer


def queue_application_score(application):
    from ai_engine.tasks import score_resume_task

    score_resume_task.delay(application.id)


class JobApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).select_related('jd').prefetch_related('resume_scores')

    def perform_create(self, serializer):
        application = serializer.save(user=self.request.user)
        queue_application_score(application)


class JobApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).select_related('jd').prefetch_related('resume_scores')

    def perform_update(self, serializer):
        previous = self.get_object()
        previous_values = {
            'jd_id': previous.jd_id,
            'jd_raw_text': previous.jd_raw_text,
        }
        application = serializer.save()
        if previous_values['jd_id'] != application.jd_id or previous_values['jd_raw_text'] != application.jd_raw_text:
            queue_application_score(application)


class JobApplicationStatusView(APIView):
    def patch(self, request, pk):
        try:
            application = JobApplication.objects.get(pk=pk, user=request.user)
        except JobApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        status_value = request.data.get('status', '').strip()
        allowed = {choice[0] for choice in JobApplication.STATUS}
        if status_value not in allowed:
            return Response({'error': 'Invalid status.'}, status=400)

        application.status = status_value
        application.save(update_fields=['status', 'last_updated'])
        return Response(JobApplicationSerializer(application, context={'request': request}).data)


class JobApplicationRescoreView(APIView):
    def post(self, request, pk):
        try:
            application = JobApplication.objects.get(pk=pk, user=request.user)
        except JobApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        from resumes.models import Resume
        has_active_resume = Resume.objects.filter(
            user=request.user,
            is_active=True,
            parse_status='DONE',
            embedded_at__isnull=False,
        ).exists()
        if not has_active_resume:
            return Response({'error': 'Upload and process an active resume before scoring.'}, status=400)

        ResumeScore.objects.create(application=application, resume=Resume.objects.get(
            user=request.user,
            is_active=True,
            parse_status='DONE',
            embedded_at__isnull=False,
        ), status='PENDING')
        queue_application_score(application)
        return Response({'status': 'queued'})


class JobApplicationMissingSkillsView(APIView):
    def patch(self, request, pk):
        try:
            application = JobApplication.objects.get(pk=pk, user=request.user)
        except JobApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        score = application.resume_scores.first()
        if not score:
            return Response({'error': 'No score found.'}, status=404)

        skills = request.data.get('missing_skills', [])
        if not isinstance(skills, list):
            return Response({'error': 'missing_skills must be a list.'}, status=400)

        score.user_edited_missing = [str(skill).strip() for skill in skills if str(skill).strip()]
        score.save(update_fields=['user_edited_missing'])
        return Response(JobApplicationSerializer(application, context={'request': request}).data)
