import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from resumes.tasks import process_resume_task

resume_id = 8
print(f"Running process_resume_task synchronously for Resume ID {resume_id}...")
try:
    process_resume_task(resume_id)
    print("Task completed successfully (synchronously).")
except Exception as e:
    print(f"Task failed: {e}")

from resumes.models import Resume
r = Resume.objects.get(id=resume_id)
print(f"New Status: {r.parse_status}")
try:
    print(f"Analysis Status: {r.analysis.status}")
except:
    print("No analysis object yet.")
