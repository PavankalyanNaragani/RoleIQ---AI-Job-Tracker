from django.conf import settings
from django.db import models


class JobDescription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_descriptions',
    )
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    raw_text = models.TextField()
    source_url = models.URLField(blank=True, max_length=1000)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.company_name} - {self.title}'


class JDAnalysis(models.Model):
    STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    job_description = models.OneToOneField(
        JobDescription,
        on_delete=models.CASCADE,
        related_name='analysis',
    )
    required_skills = models.JSONField(default=list)
    nice_to_have_skills = models.JSONField(default=list)
    seniority_level = models.CharField(max_length=100, blank=True)
    company_type = models.CharField(max_length=100, blank=True)
    key_responsibilities = models.JSONField(default=list)
    years_of_experience = models.PositiveIntegerField(default=0)
    role_summary = models.TextField(blank=True)
    parsed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    error_message = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Analysis for {self.job_description}'
