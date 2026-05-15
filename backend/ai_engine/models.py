from django.db import models

class ResumeAnalysis(models.Model):
    STATUS = [
        ('PENDING',    'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE',       'Done'),
        ('FAILED',     'Failed'),
    ]

    resume            = models.OneToOneField('resumes.Resume', on_delete=models.CASCADE, related_name='analysis')
    skills_detected   = models.JSONField(default=list)
    experience_years  = models.IntegerField(default=0)
    strengths         = models.JSONField(default=list)
    weaknesses        = models.JSONField(default=list)
    ats_score         = models.IntegerField(default=0)
    ats_feedback      = models.TextField(blank=True)
    formatting_issues = models.JSONField(default=list)
    analysed_at       = models.DateTimeField(null=True, blank=True)
    status            = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    error_message     = models.TextField(blank=True, null=True)


class JobRecommendation(models.Model):
    STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    resume = models.ForeignKey('resumes.Resume', on_delete=models.CASCADE, related_name='job_recommendations')
    jd = models.ForeignKey(
        'job_descriptions.JobDescription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='job_recommendations',
    )
    recommended_jobs = models.JSONField(default=list)
    generated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-generated_at', '-id']


class CVGeneration(models.Model):
    STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('AWAITING_REVIEW', 'Awaiting Review'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='cv_generations')
    resume = models.ForeignKey('resumes.Resume', on_delete=models.CASCADE, related_name='cv_generations')
    jd = models.ForeignKey(
        'job_descriptions.JobDescription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cv_generations',
    )
    current_checkpoint = models.CharField(max_length=50, default='summary')
    approved_sections = models.JSONField(default=dict)
    generated_content = models.TextField(blank=True)
    final_content = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-started_at', '-id']


class ResumeGeneration(models.Model):
    STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('AWAITING_REVIEW', 'Awaiting Review'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='resume_generations')
    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_resumes',
    )
    jd = models.ForeignKey(
        'job_descriptions.JobDescription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resume_generations',
    )
    profile_input = models.JSONField(default=dict)
    current_checkpoint = models.CharField(max_length=50, default='summary')
    approved_sections = models.JSONField(default=dict)
    generated_content = models.TextField(blank=True)
    final_content = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-started_at', '-id']


class InterviewQuestions(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    jd = models.ForeignKey(
        'job_descriptions.JobDescription',
        on_delete=models.CASCADE,
        related_name='interview_questions'
    )
    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='interview_questions'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='interview_questions'
    )
    technical_questions = models.JSONField(default=list, blank=True)
    behavioral_questions = models.JSONField(default=list, blank=True)
    role_specific_questions = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(null=True, blank=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"InterviewQuestions for JD#{self.jd_id} — {self.status}"
