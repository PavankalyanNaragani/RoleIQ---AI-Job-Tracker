from django.db import models


class TaskStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PROCESSING = 'PROCESSING', 'Processing'
    DONE = 'DONE', 'Done'
    FAILED = 'FAILED', 'Failed'


class JDAnalysis(models.Model):
    application = models.OneToOneField(
        'applications.JobApplication', on_delete=models.CASCADE, related_name='jd_analysis'
    )
    required_skills = models.JSONField(default=list)
    nice_to_have_skills = models.JSONField(default=list)
    seniority_level = models.CharField(max_length=50, blank=True)
    company_type = models.CharField(max_length=50, blank=True)
    key_responsibilities = models.JSONField(default=list)
    years_of_experience = models.IntegerField(null=True, blank=True)
    parsed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'JD Analysis for {self.application}'


class ResumeScore(models.Model):
    application = models.OneToOneField(
        'applications.JobApplication', on_delete=models.CASCADE, related_name='resume_score'
    )
    resume = models.ForeignKey(
        'applications.Resume', on_delete=models.SET_NULL, null=True, related_name='scores'
    )
    score = models.IntegerField(null=True, blank=True)
    confidence = models.IntegerField(null=True, blank=True)
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    user_edited_missing = models.JSONField(null=True, blank=True)
    summary = models.TextField(blank=True)
    scored_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'Score {self.score} for {self.application}'


class ResumedTailored(models.Model):
    application = models.OneToOneField(
        'applications.JobApplication', on_delete=models.CASCADE, related_name='tailored_resume'
    )
    resume = models.ForeignKey(
        'applications.Resume', on_delete=models.SET_NULL, null=True
    )
    tailored_bullets = models.JSONField(default=list)
    generated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'Tailored resume for {self.application}'


class AISuggestion(models.Model):
    class SuggestionType(models.TextChoices):
        BULLET_POINTS = 'BULLET_POINTS', 'Bullet Points'
        COVER_LETTER = 'COVER_LETTER', 'Cover Letter'
        FOLLOW_UP_EMAIL = 'FOLLOW_UP_EMAIL', 'Follow-up Email'

    application = models.ForeignKey(
        'applications.JobApplication', on_delete=models.CASCADE, related_name='suggestions'
    )
    type = models.CharField(max_length=20, choices=SuggestionType.choices)
    content = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f'{self.type} for {self.application}'