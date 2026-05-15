import logging
import hashlib
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import Resume
from .serializers import ResumeSerializer
from .tasks import process_resume_task

logger = logging.getLogger('resumes')


def calculate_file_hash(uploaded_file):
    """Return SHA-256 hash for uploaded file content."""
    hasher = hashlib.sha256()
    for chunk in uploaded_file.chunks():
        hasher.update(chunk)
    uploaded_file.seek(0)
    return hasher.hexdigest()


def calculate_stored_file_hash(resume):
    """Return SHA-256 for a stored resume file."""
    hasher = hashlib.sha256()
    with resume.file.open('rb') as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b''):
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()

class ResumeUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file         = request.FILES.get('resume')
        version_name = request.data.get('version_name', 'Default').strip() or 'Default'

        if not file:
            return Response({'error': 'No file provided.'}, status=400)
        if not file.name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files are accepted.'}, status=400)
        if file.size > 5 * 1024 * 1024:
            return Response({'error': 'File must be under 5MB.'}, status=400)

        content_hash = calculate_file_hash(file)

        # Backfill hashes for older records created before content_hash existed.
        # This keeps dedupe accurate immediately after deployment.
        for old_resume in Resume.objects.filter(user=request.user, content_hash=''):
            try:
                old_hash = calculate_stored_file_hash(old_resume)
                old_resume.content_hash = old_hash
                old_resume.save(update_fields=['content_hash'])
            except Exception as exc:
                logger.warning(f'Could not backfill hash for resume {old_resume.id}: {exc}')

        duplicate = Resume.objects.filter(user=request.user, content_hash=content_hash).order_by('-uploaded_at').first()
        if duplicate:
            Resume.objects.filter(user=request.user, is_active=True).exclude(id=duplicate.id).update(is_active=False)
            if not duplicate.is_active:
                duplicate.is_active = True
                duplicate.save(update_fields=['is_active'])

            payload = ResumeSerializer(duplicate, context={'request': request}).data
            payload['duplicate'] = True
            payload['message'] = 'Same resume already exists. Existing record activated.'
            return Response(payload, status=200)

        # Deactivate existing active resume
        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)

        resume = Resume.objects.create(
            user=request.user,
            file=file,
            original_filename=file.name,
            version_name=version_name,
            is_active=True,
            parse_status='PENDING',
            content_hash=content_hash,
        )
        process_resume_task.delay(resume.id)

        return Response(ResumeSerializer(resume, context={'request': request}).data, status=201)


class ResumeListView(ListAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class ResumeDetailView(RetrieveAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class ResumeActivateView(APIView):
    def patch(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
        resume.is_active = True
        resume.save(update_fields=['is_active'])
        return Response(ResumeSerializer(resume, context={'request': request}).data)


class ResumeDeleteView(APIView):
    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if resume.is_active:
            return Response({'error': 'Cannot delete the active resume. Activate another first.'}, status=400)

        # Best-effort file cleanup. On some Windows setups, file handles/permissions
        # can block physical delete even though we still want to remove DB record.
        try:
            resume.file.delete(save=False)   # delete local file from media/
        except Exception as exc:
            logger.warning(f'Could not delete resume file for record {resume.id}: {exc}')
        resume.delete()
        return Response(status=204)


class ResumeReanalyzeView(APIView):
    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        try:
            from ai_engine.tasks import analyze_resume_task
            analyze_resume_task.delay(resume.id)
            return Response({'status': 'queued'})
        except ImportError:
            return Response({'error': 'Analyzer agent not built yet.'}, status=503)
