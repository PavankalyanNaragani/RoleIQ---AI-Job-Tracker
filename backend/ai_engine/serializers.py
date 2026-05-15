from rest_framework import serializers

from ai_engine.models import CVGeneration, JobRecommendation, ResumeGeneration
from job_descriptions.models import JobDescription
from resumes.models import Resume


class JobRecommendationSerializer(serializers.ModelSerializer):
    resume_id = serializers.PrimaryKeyRelatedField(
        source='resume',
        queryset=Resume.objects.none(),
    )
    jd_id = serializers.PrimaryKeyRelatedField(
        source='jd',
        queryset=JobDescription.objects.none(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = JobRecommendation
        fields = [
            'id',
            'resume_id',
            'jd_id',
            'recommended_jobs',
            'generated_at',
            'status',
            'error_message',
        ]
        read_only_fields = ['id', 'recommended_jobs', 'generated_at', 'status', 'error_message']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            self.fields['resume_id'].queryset = Resume.objects.filter(user=request.user)
            self.fields['jd_id'].queryset = JobDescription.objects.filter(user=request.user, is_archived=False)


class CVGenerationSerializer(serializers.ModelSerializer):
    resume_id = serializers.PrimaryKeyRelatedField(
        source='resume',
        queryset=Resume.objects.none(),
    )
    jd_id = serializers.PrimaryKeyRelatedField(
        source='jd',
        queryset=JobDescription.objects.none(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = CVGeneration
        fields = [
            'id',
            'resume_id',
            'jd_id',
            'current_checkpoint',
            'approved_sections',
            'generated_content',
            'final_content',
            'status',
            'started_at',
            'completed_at',
            'error_message',
        ]
        read_only_fields = [
            'id',
            'current_checkpoint',
            'approved_sections',
            'generated_content',
            'final_content',
            'status',
            'started_at',
            'completed_at',
            'error_message',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            self.fields['resume_id'].queryset = Resume.objects.filter(user=request.user)
            self.fields['jd_id'].queryset = JobDescription.objects.filter(user=request.user, is_archived=False)


class ResumeGenerationSerializer(serializers.ModelSerializer):
    resume_id = serializers.PrimaryKeyRelatedField(
        source='resume',
        queryset=Resume.objects.none(),
        required=False,
        allow_null=True,
    )
    jd_id = serializers.PrimaryKeyRelatedField(
        source='jd',
        queryset=JobDescription.objects.none(),
        required=False,
        allow_null=True,
    )
    profile_input = serializers.JSONField(required=False)

    class Meta:
        model = ResumeGeneration
        fields = [
            'id',
            'resume_id',
            'jd_id',
            'profile_input',
            'current_checkpoint',
            'approved_sections',
            'generated_content',
            'final_content',
            'status',
            'started_at',
            'completed_at',
            'error_message',
        ]
        read_only_fields = [
            'id',
            'current_checkpoint',
            'approved_sections',
            'generated_content',
            'final_content',
            'status',
            'started_at',
            'completed_at',
            'error_message',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            self.fields['resume_id'].queryset = Resume.objects.filter(user=request.user)
            self.fields['jd_id'].queryset = JobDescription.objects.filter(user=request.user, is_archived=False)

    def validate(self, attrs):
        resume = attrs.get('resume')
        profile = attrs.get('profile_input') or {}
        has_profile = any(str(value).strip() for value in [
            profile.get('name', ''),
            profile.get('email', ''),
            profile.get('phone', ''),
            profile.get('linkedin', ''),
            profile.get('github', ''),
            profile.get('experience_description', ''),
        ])
        if not resume and not has_profile:
            raise serializers.ValidationError('Provide either resume_id or profile_input.')
        return attrs
