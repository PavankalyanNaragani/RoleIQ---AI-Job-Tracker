import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from resumes.tasks import process_resume_task

resume_id = 8
print(f"Triggering process_resume_task for Resume ID {resume_id}...")
process_resume_task.delay(resume_id)
print("Task queued.")
