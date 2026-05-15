import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from resumes.models import Resume
from ai_engine.models import ResumeAnalysis

print("--- Resume Statuses ---")
for r in Resume.objects.all():
    print(f"ID: {r.id}, Version: {r.version_name}, File: {r.original_filename}, Status: {r.parse_status}, Uploaded: {r.uploaded_at}")
    try:
        a = r.analysis
        print(f"  Analysis Status: {a.status}, Error: {a.error_message}")
    except ResumeAnalysis.DoesNotExist:
        print("  Analysis Status: NO ANALYSIS OBJECT")
print("-----------------------")
