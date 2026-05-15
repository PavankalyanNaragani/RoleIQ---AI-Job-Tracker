from collections import Counter
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView


def _application_queryset(user):
    from applications.models import JobApplication

    return JobApplication.objects.filter(user=user)


class DashboardView(APIView):
    def get(self, request):
        user = request.user

        app_qs = _application_queryset(user)
        total = app_qs.count()
        by_status = {
            row['status']: row['count']
            for row in app_qs.values('status').annotate(count=Count('id'))
        }
        progressed = app_qs.exclude(status='APPLIED').count()
        app_stats = {
            'total': total,
            'by_status': by_status,
            'response_rate': round(progressed / total * 100, 1) if total else 0,
        }

        active_resume = None
        try:
            from resumes.models import Resume

            resume = Resume.objects.filter(user=user, is_active=True).first()
            if resume:
                ats_score = None
                try:
                    analysis = resume.analysis
                    if analysis.status == 'DONE':
                        ats_score = analysis.ats_score
                except Exception:
                    pass

                active_resume = {
                    'id': resume.id,
                    'version_name': resume.version_name,
                    'ats_score': ats_score,
                    'parse_status': resume.parse_status,
                }
        except Exception:
            pass

        return Response({
            'application_stats': app_stats,
            'active_resume': active_resume,
            'top_skill_gaps': [],
            'pending_hil': 0,
        })


class FunnelAnalyticsView(APIView):
    def get(self, request):
        counts = {
            row['status']: row['count']
            for row in _application_queryset(request.user).values('status').annotate(count=Count('id'))
        }
        ordered_statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']
        data = [{'status': status, 'count': counts.get(status, 0)} for status in ordered_statuses]
        return Response({'funnel': data})


class VelocityAnalyticsView(APIView):
    def get(self, request):
        app_qs = _application_queryset(request.user)
        today = timezone.localdate()
        start_date = today - timedelta(days=7 * 7)
        weeks = []
        for idx in range(8):
            week_start = start_date + timedelta(days=idx * 7)
            week_end = week_start + timedelta(days=6)
            count = app_qs.filter(applied_date__gte=week_start, applied_date__lte=week_end).count()
            weeks.append({
                'week_label': f'{week_start.strftime("%d %b")}',
                'applications': count,
            })
        return Response({'velocity': weeks})


class SkillGapsAnalyticsView(APIView):
    def get(self, request):
        from applications.models import JobApplication, ResumeScore

        completed_scores = ResumeScore.objects.filter(application__user=request.user, status='DONE')
        overall_counter = Counter()
        for score in completed_scores:
            gaps = score.user_edited_missing or score.missing_skills or []
            for skill in gaps:
                normalized = str(skill).strip().lower()
                if normalized:
                    overall_counter[normalized] += 1

        rejected_app_ids = JobApplication.objects.filter(
            user=request.user,
            status='REJECTED',
        ).values_list('id', flat=True)
        rejected_scores = ResumeScore.objects.filter(application_id__in=rejected_app_ids, status='DONE')
        rejection_counter = Counter()
        for score in rejected_scores:
            gaps = score.user_edited_missing or score.missing_skills or []
            for skill in gaps:
                normalized = str(skill).strip().lower()
                if normalized:
                    rejection_counter[normalized] += 1

        data = []
        for skill, frequency in overall_counter.most_common(15):
            data.append({
                'skill': skill,
                'frequency': frequency,
                'rejection_correlation': rejection_counter.get(skill, 0),
            })
        return Response({'top_gaps': data})


class ResponseRateAnalyticsView(APIView):
    def get(self, request):
        app_qs = _application_queryset(request.user)
        total = app_qs.count()
        progressed = app_qs.exclude(status='APPLIED').count()
        response_rate = round(progressed / total * 100, 1) if total else 0
        return Response({'total_applications': total, 'progressed_applications': progressed, 'response_rate': response_rate})


class SourcesAnalyticsView(APIView):
    def get(self, request):
        counts = {
            row['source']: row['count']
            for row in _application_queryset(request.user).values('source').annotate(count=Count('id'))
        }
        ordered_sources = ['LinkedIn', 'Naukri', 'Company Website', 'Referral', 'Other']
        data = [{'source': source, 'count': counts.get(source, 0)} for source in ordered_sources]
        return Response({'sources': data})


class ScoreDistributionAnalyticsView(APIView):
    def get(self, request):
        from applications.models import ResumeScore

        scores = ResumeScore.objects.filter(application__user=request.user, status='DONE').values_list('score', flat=True)
        buckets = [
            {'bucket': '0-20', 'min': 0, 'max': 20, 'count': 0},
            {'bucket': '21-40', 'min': 21, 'max': 40, 'count': 0},
            {'bucket': '41-60', 'min': 41, 'max': 60, 'count': 0},
            {'bucket': '61-80', 'min': 61, 'max': 80, 'count': 0},
            {'bucket': '81-100', 'min': 81, 'max': 100, 'count': 0},
        ]
        for score in scores:
            for bucket in buckets:
                if bucket['min'] <= score <= bucket['max']:
                    bucket['count'] += 1
                    break

        data = [{'bucket': bucket['bucket'], 'count': bucket['count']} for bucket in buckets]
        return Response({'score_distribution': data})
