import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('jobtracker')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-stale-applications-daily': {
        'task': 'apps.ai_engine.tasks.check_stale_applications',
        'schedule': crontab(hour=9, minute=0),
    },
}