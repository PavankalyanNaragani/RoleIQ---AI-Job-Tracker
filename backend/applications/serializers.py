from rest_framework import serializers

from .models import JobApplication, ResumeScore
from job_descriptions.models import JobDescription


class ResumeScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeScore
        fields = [
            'id',
            'score',
            'confidence',
            'matched_skills',
            'missing_skills',
            'user_edited_missing',
            'summary',
            'scored_at',
            'status',
            'error_message',
        ]
        read_only_fields = fields


class JobApplicationSerializer(serializers.ModelSerializer):
    jd_id = serializers.PrimaryKeyRelatedField(
        source='jd',
        queryset=JobDescription.objects.none(),
        allow_null=True,
        required=False,
    )
    jd_summary = serializers.SerializerMethodField()
    latest_score = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id',
            'jd_id',
            'jd_summary',
            'company_name',
            'role_title',
            'job_url',
            'status',
            'jd_raw_text',
            'applied_date',
            'last_updated',
            'notes',
            'source',
            'was_selected_for_interview',
            'latest_score',
        ]
        read_only_fields = ['id', 'last_updated', 'jd_summary', 'latest_score']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            self.fields['jd_id'].queryset = JobDescription.objects.filter(
                user=request.user,
                is_archived=False,
            )
        else:
            self.fields['jd_id'].queryset = JobDescription.objects.none()

    def validate(self, attrs):
        jd = attrs.get('jd', getattr(self.instance, 'jd', None))
        jd_raw_text = attrs.get('jd_raw_text', getattr(self.instance, 'jd_raw_text', ''))
        if not jd and not jd_raw_text.strip():
            raise serializers.ValidationError({
                'jd_raw_text': 'Provide JD text or link this application to a saved JD.'
            })
        return attrs

    def get_jd_summary(self, obj):
        if not obj.jd:
            return None
        return {
            'id': obj.jd_id,
            'title': obj.jd.title,
            'company_name': obj.jd.company_name,
        }

    def get_latest_score(self, obj):
        score = obj.resume_scores.first()
        if not score:
            return None
        return ResumeScoreSerializer(score).data
