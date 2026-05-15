from django.db import models
from django.conf import settings


class Resume(models.Model):
    STATUS = [
        ('PENDING',    'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE',       'Done'),
        ('FAILED',     'Failed'),
    ]
    user              = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file              = models.FileField(upload_to='resumes/')     # saved in backend/media/resumes/
    original_filename = models.CharField(max_length=255)
    version_name      = models.CharField(max_length=100, default='Default')
    is_active         = models.BooleanField(default=True)
    raw_text          = models.TextField(blank=True, default='')   # extracted PDF text
    parse_status      = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    embedded_at       = models.DateTimeField(null=True, blank=True)
    content_hash      = models.CharField(max_length=64, blank=True, default='', db_index=True)
    uploaded_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.user.email} — {self.version_name}'
