from rest_framework import serializers
from .models import JobApplication, Resume, Tag, Reminder
from apps.ai_engine.models import JDAnalysis, ResumeScore


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'original_filename', 'version_name', 'is_active', 'embedded_at', 'uploaded_at']
        read_only_fields = ['embedded_at', 'uploaded_at']


class JDAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = JDAnalysis
        fields = [
            'required_skills', 'nice_to_have_skills', 'seniority_level',
            'company_type', 'key_responsibilities', 'parsed_at', 'status', 'error_message',
        ]


class ResumeScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeScore
        fields = [
            'score', 'confidence', 'matched_skills', 'missing_skills',
            'user_edited_missing', 'summary', 'scored_at', 'status', 'error_message',
        ]


class JobApplicationSerializer(serializers.ModelSerializer):
    jd_analysis = JDAnalysisSerializer(read_only=True)
    resume_score = ResumeScoreSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.none(), source='tags', required=False
    )

    class Meta:
        model = JobApplication
        fields = [
            'id', 'company_name', 'role_title', 'job_url', 'status',
            'jd_raw_text', 'applied_date', 'last_updated', 'notes', 'source',
            'was_selected_for_interview', 'tags', 'tag_ids',
            'jd_analysis', 'resume_score',
        ]
        read_only_fields = ['last_updated']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['tag_ids'].child_relation.queryset = Tag.objects.filter(user=request.user)


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ['id', 'application', 'due_date', 'message', 'is_dismissed', 'email_sent', 'created_at']
        read_only_fields = ['email_sent', 'created_at']