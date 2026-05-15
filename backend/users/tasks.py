import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('users')


@shared_task(max_retries=3, default_retry_delay=30)
def send_activation_email_task(user_id, token):
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        activation_url = f"{settings.FRONTEND_URL}/activate?token={token}"
        send_mail(
            subject='Activate your JobTracker account',
            message=f"""
Hi {user.full_name},

Activate your account by visiting:
{activation_url}

This link expires in 24 hours.
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
        logger.info(f'Activation email sent → user {user_id}')
    except Exception as exc:
        logger.error(f'Activation email failed → user {user_id}: {exc}')
        raise


@shared_task(max_retries=3, default_retry_delay=30)
def send_welcome_email_task(user_id):
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject='Welcome to JobTracker!',
            message=f"""
Hi {user.full_name},

Your account is active. Here's what you can do:

  ✅ Upload your resume — get an AI ATS score
  ✅ Paste job descriptions — see your match score
  ✅ Generate a tailored CV with AI (you approve each section)
  ✅ Get top 5 job recommendations
  ✅ Track all applications on a Kanban board

Go to: {settings.FRONTEND_URL}/dashboard
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as exc:
        logger.error(f'Welcome email failed → user {user_id}: {exc}')


@shared_task(max_retries=2)
def send_login_alert_task(user_id, ip, user_agent):
    from users.models import User
    from django.utils import timezone
    try:
        user = User.objects.get(id=user_id)
        now = timezone.now().strftime('%d %b %Y, %H:%M')
        send_mail(
            subject='New login to your JobTracker account',
            message=f"""
Hi {user.full_name},

New login detected:
  Time:   {now}
  IP:     {ip}
  Device: {user_agent[:80]}

If this wasn't you, reset your password immediately.
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as exc:
        logger.error(f'Login alert failed → user {user_id}: {exc}')


@shared_task(max_retries=3)
def send_password_reset_task(user_id, token):
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_mail(
            subject='Reset your JobTracker password',
            message=f"""
Hi {user.full_name},

Reset your password here:
{reset_url}

Expires in 1 hour. Ignore if you didn't request this.
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as exc:
        logger.error(f'Password reset email failed → user {user_id}: {exc}')