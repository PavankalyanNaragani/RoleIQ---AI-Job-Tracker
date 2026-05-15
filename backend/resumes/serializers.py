from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    analysis = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = Resume
        fields = ['id', 'version_name', 'original_filename', 'is_active',
                  'parse_status', 'embedded_at', 'uploaded_at', 'file_url', 'analysis']
        read_only_fields = ['id', 'uploaded_at', 'embedded_at', 'parse_status']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_analysis(self, obj):
        try:
            a = obj.analysis
            return {
                'status':            a.status,
                'ats_score':         a.ats_score if a.status == 'DONE' else None,
                'skills_detected':   a.skills_detected if a.status == 'DONE' else [],
                'strengths':         a.strengths if a.status == 'DONE' else [],
                'weaknesses':        a.weaknesses if a.status == 'DONE' else [],
                'formatting_issues': a.formatting_issues if a.status == 'DONE' else [],
                'ats_feedback':      a.ats_feedback if a.status == 'DONE' else '',
                'error_message':     a.error_message,
            }
        except Exception:
            return None