from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import JobApplication, Resume, Tag, Reminder
from .serializers import JobApplicationSerializer, ResumeSerializer, TagSerializer, ReminderSerializer


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    filterset_fields = ['status', 'source']
    search_fields = ['company_name', 'role_title']
    ordering_fields = ['applied_date', 'last_updated']

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user)\
            .select_related('jd_analysis', 'resume_score')\
            .prefetch_related('tags')\
            .order_by('-last_updated')

    def perform_create(self, serializer):
        application = serializer.save(user=self.request.user)
        if application.jd_raw_text.strip():
            try:
                from apps.ai_engine.tasks import parse_jd_task
                parse_jd_task.delay(application.id)
            except Exception:
                pass

    @action(detail=True, methods=['post'])
    def rescore(self, request, pk=None):
        app = self.get_object()
        score_obj = getattr(app, 'resume_score', None)
        if score_obj and score_obj.status == 'PROCESSING':
            return Response({'error': 'Scoring already in progress'}, status=429)
        if score_obj:
            score_obj.status = 'PENDING'
            score_obj.error_message = None
            score_obj.save(update_fields=['status', 'error_message'])
        try:
            from apps.ai_engine.tasks import score_resume_task
            score_resume_task.delay(app.id)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        return Response({'status': 'queued'})

    @action(detail=True, methods=['post'])
    def tailor(self, request, pk=None):
        app = self.get_object()
        try:
            from apps.ai_engine.tasks import tailor_resume_task
            tailor_resume_task.delay(app.id)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        return Response({'status': 'queued'})

    @action(detail=True, methods=['get'])
    def tailored(self, request, pk=None):
        app = self.get_object()
        tailored = getattr(app, 'tailored_resume', None)
        if not tailored:
            return Response({'status': 'NOT_STARTED'}, status=404)
        return Response({
            'status': tailored.status,
            'bullets': tailored.tailored_bullets,
            'generated_at': tailored.generated_at,
            'error_message': tailored.error_message,
        })

    @action(detail=True, methods=['patch'])
    def edit_skills(self, request, pk=None):
        app = self.get_object()
        field = request.data.get('field')
        value = request.data.get('value')
        if not isinstance(value, list):
            return Response({'error': 'value must be a list of strings'}, status=400)
        if field == 'required_skills':
            jd = getattr(app, 'jd_analysis', None)
            if not jd:
                return Response({'error': 'No JD analysis found'}, status=404)
            jd.required_skills = value
            jd.save(update_fields=['required_skills'])
            return Response({'updated': 'required_skills'})
        elif field == 'missing_skills':
            score = getattr(app, 'resume_score', None)
            if not score:
                return Response({'error': 'No resume score found'}, status=404)
            score.user_edited_missing = value
            score.missing_skills = value
            score.save(update_fields=['user_edited_missing', 'missing_skills'])
            return Response({'updated': 'missing_skills'})
        return Response({'error': 'field must be required_skills or missing_skills'}, status=400)

    @action(detail=True, methods=['patch'])
    def update_interview_outcome(self, request, pk=None):
        app = self.get_object()
        selected = request.data.get('was_selected_for_interview')
        if selected is None:
            return Response({'error': 'was_selected_for_interview is required'}, status=400)
        app.was_selected_for_interview = bool(selected)
        app.save(update_fields=['was_selected_for_interview'])
        return Response({'status': 'updated'})


class ResumeUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get('resume')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        if not file.name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files are accepted'}, status=400)
        version_name = request.data.get('version_name', 'Default')
        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
        resume = Resume.objects.create(
            user=request.user,
            file=file,
            original_filename=file.name,
            version_name=version_name,
            is_active=True,
        )
        try:
            from apps.ai_engine.tasks import embed_resume_task
            embed_resume_task.delay(resume.id)
        except Exception:
            pass
        return Response(ResumeSerializer(resume).data, status=201)


class ResumeListView(generics.ListAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)


class ResumeActivateView(APIView):
    def patch(self, request, pk):
        resume = get_object_or_404(Resume, id=pk, user=request.user)
        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
        resume.is_active = True
        resume.save(update_fields=['is_active'])
        return Response(ResumeSerializer(resume).data)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer

    def get_queryset(self):
        return Reminder.objects.filter(
            application__user=self.request.user,
            is_dismissed=False,
        )