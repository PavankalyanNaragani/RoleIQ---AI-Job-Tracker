import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_engine.tasks import analyze_resume_task

resume_id = 8
print(f"Running analyze_resume_task synchronously for Resume ID {resume_id}...")
try:
    analyze_resume_task(resume_id)
    print("Task completed successfully (synchronously).")
except Exception as e:
    print(f"Task failed: {e}")

from resumes.models import Resume
r = Resume.objects.get(id=resume_id)
try:
    print(f"New Status: {r.parse_status}")
    print(f"Analysis Status: {r.analysis.status}")
    print(f"ATS Score: {r.analysis.ats_score}")
except:
    print("Something went wrong.")
