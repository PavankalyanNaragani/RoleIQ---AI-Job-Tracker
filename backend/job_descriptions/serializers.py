from rest_framework import serializers

from .models import JDAnalysis, JobDescription
from resumes.models import Resume


class JDAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = JDAnalysis
        fields = [
            'required_skills',
            'nice_to_have_skills',
            'seniority_level',
            'company_type',
            'key_responsibilities',
            'years_of_experience',
            'role_summary',
            'parsed_at',
            'status',
            'error_message',
        ]
        read_only_fields = fields


class JobDescriptionSerializer(serializers.ModelSerializer):
    analysis = serializers.SerializerMethodField()
    resume_match = serializers.SerializerMethodField()

    class Meta:
        model = JobDescription
        fields = [
            'id',
            'title',
            'company_name',
            'raw_text',
            'source_url',
            'is_archived',
            'created_at',
            'analysis',
            'resume_match',
        ]
        read_only_fields = ['id', 'created_at', 'analysis', 'resume_match']

    def get_analysis(self, obj):
        try:
            return JDAnalysisSerializer(obj.analysis).data
        except JDAnalysis.DoesNotExist:
            return None

    def get_resume_match(self, obj):
        """
        Compare this JD against all parsed/analyzed resumes for the same user.
        Returns per-resume matched/missing skills and best resume recommendation.
        """
        if not self.context.get('include_resume_match'):
            return None

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        try:
            analysis = obj.analysis
        except JDAnalysis.DoesNotExist:
            return {
                'status': 'pending_jd_analysis',
                'message': 'JD analysis is not available yet.',
                'recommended_resume_id': None,
                'recommended_resume_name': None,
                'items': [],
            }

        required_skills = [
            str(skill).strip()
            for skill in (analysis.required_skills or [])
            if str(skill).strip()
        ]
        if not required_skills:
            return {
                'status': 'no_required_skills',
                'message': 'No required skills found in JD analysis yet.',
                'recommended_resume_id': None,
                'recommended_resume_name': None,
                'items': [],
            }

        required_index = {skill.lower(): skill for skill in required_skills}
        required_keys = set(required_index.keys())

        resumes = Resume.objects.filter(
            user=request.user,
            parse_status='DONE',
            analysis__status='DONE',
        ).select_related('analysis')

        items = []
        for resume in resumes:
            resume_skills = {
                str(skill).strip().lower()
                for skill in (resume.analysis.skills_detected or [])
                if str(skill).strip()
            }
            matched_keys = required_keys.intersection(resume_skills)
            missing_keys = required_keys.difference(resume_skills)

            total_required = len(required_keys)
            coverage = round((len(matched_keys) / total_required) * 100, 1) if total_required else 0

            items.append({
                'resume_id': resume.id,
                'version_name': resume.version_name,
                'original_filename': resume.original_filename,
                'is_active': resume.is_active,
                'resume_ats_score': resume.analysis.ats_score,
                'match_score': coverage,
                'matched_skills_count': len(matched_keys),
                'total_required_skills': total_required,
                'matched_skills': sorted(required_index[k] for k in matched_keys),
                'missing_skills': sorted(required_index[k] for k in missing_keys),
            })

        if not items:
            return {
                'status': 'no_resumes',
                'message': 'No analyzed resumes available to compare.',
                'recommended_resume_id': None,
                'recommended_resume_name': None,
                'items': [],
            }

        ranked = sorted(
            items,
            key=lambda r: (
                r['match_score'],
                r['resume_ats_score'],
                r['is_active'],
            ),
            reverse=True,
        )
        best = ranked[0]

        return {
            'status': 'ready',
            'message': 'Resume matching computed from JD required skills.',
            'recommended_resume_id': best['resume_id'],
            'recommended_resume_name': best['version_name'],
            'items': ranked,
        }
