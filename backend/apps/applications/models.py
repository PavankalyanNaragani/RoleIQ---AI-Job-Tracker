from django.db import models
from django.conf import settings


class Tag(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')
    original_filename = models.CharField(max_length=255)
    version_name = models.CharField(max_length=100, default='Default')
    is_active = models.BooleanField(default=False)
    embedded_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.user.email} — {self.version_name}'


class JobApplication(models.Model):
    class Status(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        SCREENING = 'SCREENING', 'Screening'
        INTERVIEW = 'INTERVIEW', 'Interview'
        OFFER = 'OFFER', 'Offer'
        REJECTED = 'REJECTED', 'Rejected'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'

    class Source(models.TextChoices):
        LINKEDIN = 'LinkedIn', 'LinkedIn'
        NAUKRI = 'Naukri', 'Naukri'
        COMPANY = 'Company Website', 'Company Website'
        REFERRAL = 'Referral', 'Referral'
        OTHER = 'Other', 'Other'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    company_name = models.CharField(max_length=200)
    role_title = models.CharField(max_length=200)
    job_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    jd_raw_text = models.TextField(blank=True)
    applied_date = models.DateField()
    last_updated = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.OTHER)
    was_selected_for_interview = models.BooleanField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='applications')

    class Meta:
        ordering = ['-last_updated']

    def __str__(self):
        return f'{self.role_title} at {self.company_name}'


class Reminder(models.Model):
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='reminders')
    due_date = models.DateField()
    message = models.TextField()
    is_dismissed = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f'Reminder: {self.application} on {self.due_date}'