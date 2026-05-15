from collections import Counter
from datetime import timedelta
from django.db.models import Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.applications.models import JobApplication
from apps.ai_engine.models import ResumeScore


class FunnelView(APIView):
    def get(self, request):
        counts = (
            JobApplication.objects
            .filter(user=request.user)
            .values('status')
            .annotate(count=Count('id'))
        )
        return Response({row['status']: row['count'] for row in counts})


class VelocityView(APIView):
    def get(self, request):
        results = []
        now = timezone.now()
        for i in range(7, -1, -1):
            week_start = (now - timedelta(weeks=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            week_end = week_start + timedelta(weeks=1)
            count = JobApplication.objects.filter(
                user=request.user,
                applied_date__gte=week_start.date(),
                applied_date__lt=week_end.date(),
            ).count()
            results.append({'week': week_start.strftime('%b %d'), 'count': count})
        return Response(results)


class SkillGapsView(APIView):
    def get(self, request):
        scores = ResumeScore.objects.filter(
            application__user=request.user, status='DONE'
        )
        counter = Counter()
        for score in scores:
            gaps = score.user_edited_missing or score.missing_skills or []
            for skill in gaps:
                counter[skill.lower().strip()] += 1

        rejected_ids = JobApplication.objects.filter(
            user=request.user, status='REJECTED'
        ).values_list('id', flat=True)

        rejection_gaps = Counter()
        for score in ResumeScore.objects.filter(application_id__in=rejected_ids, status='DONE'):
            for skill in (score.user_edited_missing or score.missing_skills or []):
                rejection_gaps[skill.lower().strip()] += 1

        return Response({
            'top_gaps': [
                {
                    'skill': skill,
                    'frequency': freq,
                    'rejection_correlation': rejection_gaps.get(skill, 0),
                }
                for skill, freq in counter.most_common(15)
            ]
        })


class ResponseRateView(APIView):
    def get(self, request):
        total = JobApplication.objects.filter(user=request.user).count()
        past_applied = JobApplication.objects.filter(
            user=request.user,
            status__in=['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED']
        ).count()
        rate = round((past_applied / total * 100), 1) if total else 0
        return Response({'total': total, 'past_applied': past_applied, 'response_rate': rate})


class SourceBreakdownView(APIView):
    def get(self, request):
        counts = (
            JobApplication.objects
            .filter(user=request.user)
            .values('source')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response(list(counts))


class ScoreDistributionView(APIView):
    def get(self, request):
        scores = list(
            ResumeScore.objects
            .filter(application__user=request.user, status='DONE', score__isnull=False)
            .values_list('score', flat=True)
        )
        buckets = {f'{i}-{i+9}': 0 for i in range(0, 100, 10)}
        for s in scores:
            bucket = f'{(s // 10) * 10}-{(s // 10) * 10 + 9}'
            if bucket in buckets:
                buckets[bucket] += 1
        return Response({'distribution': buckets, 'total': len(scores)})