from django.conf import settings
from django.db import models
from django.utils import timezone


class JobApplication(models.Model):
    STATUS = [
        ('APPLIED', 'Applied'),
        ('SCREENING', 'Screening'),
        ('INTERVIEW', 'Interview'),
        ('OFFER', 'Offer'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    SOURCE = [
        ('LinkedIn', 'LinkedIn'),
        ('Naukri', 'Naukri'),
        ('Company Website', 'Company Website'),
        ('Referral', 'Referral'),
        ('Other', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    jd = models.ForeignKey(
        'job_descriptions.JobDescription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
    )
    company_name = models.CharField(max_length=255)
    role_title = models.CharField(max_length=255)
    job_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='APPLIED')
    jd_raw_text = models.TextField(blank=True)
    applied_date = models.DateField(default=timezone.localdate)
    last_updated = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    source = models.CharField(max_length=30, choices=SOURCE, default='Other')
    was_selected_for_interview = models.BooleanField(null=True, blank=True)

    class Meta:
        ordering = ['-last_updated']

    def __str__(self):
        return f'{self.company_name} - {self.role_title}'


class ResumeScore(models.Model):
    STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='resume_scores',
    )
    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.CASCADE,
        related_name='resume_scores',
    )
    score = models.IntegerField(default=0)
    confidence = models.IntegerField(default=0)
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    user_edited_missing = models.JSONField(null=True, blank=True)
    summary = models.TextField(blank=True)
    scored_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-scored_at', '-id']


class Tag(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='application_tags',
    )
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name


class Reminder(models.Model):
    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='reminders',
    )
    due_date = models.DateTimeField()
    message = models.CharField(max_length=255)
    is_dismissed = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date']
