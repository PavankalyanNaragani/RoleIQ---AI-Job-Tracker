# AI-Powered Job Application Tracker — Implementation Plan v5

**Stack (Local):** Django · DRF · Celery · Redis · React (JavaScript) · LangGraph · Gemini API · ChromaDB · SQLite
**Frontend:** Plain React + JavaScript — no TypeScript, no Next.js
**Timeline:** 10–12 weeks
**Storage:** Local filesystem (resumes saved on your computer, not S3)
**Email:** Console backend (prints emails to terminal — no SMTP needed locally)
**Database:** SQLite (zero setup — built into Python)
**Cloud:** Optional Phase 12 — only when the app is fully working locally

> **What changed in v5:**
> - Everything runs on your local machine with zero cloud accounts needed
> - SQLite instead of PostgreSQL (no database server to install)
> - Local filesystem instead of AWS S3 (files saved in `/media/` folder)
> - Email prints to terminal instead of sending real emails
> - Redis still needed (install locally — one command)
> - Cloud migration is the last optional phase

---

## Build Order — One Feature at a Time

Complete **each feature fully** (backend working + frontend working in browser)
before starting the next one. Do not build two features at once.

```
 Phase 0    →  One-time local setup (30 minutes)
 Feature 1  →  Authentication (register, activate, login, logout)
 Feature 2  →  Dashboard shell (layout + stats skeleton)
 Feature 2b →  Public Landing Page (app showcase for new visitors)
 Feature 3  →  Resume Upload & Management
 Feature 4  →  Job Description Management
 Feature 5  →  Job Applications (Kanban board)
 Feature 6  →  Agent 1 — Resume Analyzer
 Feature 7  →  Agent 2 — JD Analyzer
 Feature 8  →  Resume Scoring (match resume vs JD)
 Feature 9  →  Agent 3 — Job Recommender (Top 5 jobs)
 Feature 10 →  Agent 4 — CV Generator (Human-in-Loop)
 Feature 11 →  Agent 5 — Resume Generator (Human-in-Loop)
 Feature 12 →  Analytics Dashboard
 Phase 13   →  [OPTIONAL] Cloud Deployment (AWS)
```

---

## Phase 0 — One-Time Local Setup

### What you need to install (once, on your machine)

| Tool | Purpose | Install |
|------|---------|---------|
| Python 3.11+ | Backend | python.org |
| Node.js 18+ | Frontend | nodejs.org |
| Redis | Task queue for Celery | See below |
| Git | Version control | git-scm.com |

**Install Redis locally:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu / WSL
sudo apt install redis-server
sudo service redis-server start

# Windows — use WSL (Ubuntu) or Docker Desktop
docker run -d -p 6379:6379 redis:alpine
```

**Verify Redis is running:**
```bash
redis-cli ping
# should print: PONG
```

### Project Folder Structure (create this first)

```
jobtracker/
├── backend/        ← Django project lives here
├── frontend/       ← React app lives here
└── .env            ← single env file for local config
```

```bash
mkdir jobtracker
cd jobtracker
mkdir backend frontend
```

### Backend — One-Time Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate          # Mac/Linux
venv\Scripts\activate             # Windows

# Install all packages (all local — no cloud SDKs needed yet)
pip install django \
    djangorestframework \
    djangorestframework-simplejwt \
    django-cors-headers \
    python-dotenv \
    django-filter \
    celery \
    redis \
    langchain \
    langgraph \
    langchain-google-genai \
    chromadb \
    PyPDF2 \
    Pillow \
    python-json-logger

# Save dependencies
pip freeze > requirements.txt

# Create Django project
django-admin startproject config .

# Create all apps upfront (we build them one by one)
python manage.py startapp users
python manage.py startapp resumes
python manage.py startapp job_descriptions
python manage.py startapp applications
python manage.py startapp ai_engine
python manage.py startapp analytics
```

### Backend — `config/settings.py` (Full Local Config)

Replace the entire settings file with this local-ready version:

```python
from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'local-dev-secret-key-change-in-production')

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',

    # Our apps (all listed now, built one at a time)
    'users',
    'resumes',
    'job_descriptions',
    'applications',
    'ai_engine',
    'analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',    # must be FIRST
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ─── DATABASE ─────────────────────────────────────────────────────────────────
# SQLite — zero setup, file lives in backend/db.sqlite3
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ─── AUTH ─────────────────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

# ─── JWT ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '60/minute',
        'ai_endpoints': '10/minute',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),    # longer for local dev comfort
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ─── CELERY ───────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'Asia/Kolkata'

# ─── EMAIL — prints to terminal (no SMTP needed locally) ──────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@jobtracker.local'
FRONTEND_URL = 'http://localhost:5173'

# ─── FILE STORAGE — local filesystem (no S3 needed locally) ───────────────────
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'   # files saved in backend/media/

# ─── CHROMADB — local folder ───────────────────────────────────────────────────
CHROMA_DB_PATH = str(BASE_DIR / 'chroma_db')   # saved in backend/chroma_db/

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',    # Vite dev server
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True

# ─── STATIC FILES ─────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── GEMINI API ───────────────────────────────────────────────────────────────
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')

# ─── LOGGING ──────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '[{levelname}] {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'users':      {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'ai_engine':  {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'celery':     {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'resumes':    {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}
```

### Backend — `config/celery.py`

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('jobtracker')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### Backend — `config/__init__.py`

```python
from .celery import app as celery_app
__all__ = ['celery_app']
```

### Backend — `config/urls.py` (start minimal, add paths as features are built)

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # API routes added here one by one as each feature is built
]

# Serve local media files in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Backend — `.env` file (in project root `jobtracker/.env`)

```env
# This is the only config file you need locally
SECRET_KEY=local-dev-secret-change-later

# Get this free from https://aistudio.google.com/
GOOGLE_API_KEY=your_gemini_api_key_here

# Leave everything else as defaults for local dev
# EMAIL_BACKEND is already set to console in settings.py
# DATABASE is already SQLite in settings.py
# FILES are already stored locally in settings.py
```

### Backend — First Migration

```bash
# Still inside backend/ with venv active
python manage.py migrate
python manage.py createsuperuser   # optional, for admin panel
```

### How to Run the Backend (3 terminal tabs)

```bash
# Tab 1 — Django server
cd backend
source venv/bin/activate
python manage.py runserver

# Tab 2 — Celery worker (needed for background AI tasks)
cd backend
source venv/bin/activate
celery -A config worker --loglevel=info

# Tab 3 — (optional) Celery Beat for scheduled tasks like reminders
cd backend
source venv/bin/activate
celery -A config beat --loglevel=info
```

### Frontend — One-Time Setup

```bash
cd ../frontend

# Create React app (plain JavaScript — no TypeScript)
npm create vite@latest . -- --template react

# Install packages
npm install \
    axios \
    @tanstack/react-query \
    react-router-dom \
    react-hot-toast \
    lucide-react \
    recharts \
    zustand \
    @hello-pangea/dnd

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**`tailwind.config.js`:**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**`src/index.css`** — replace entire file:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`src/main.jsx`:**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
```

**`src/api/client.js`** — Axios with auto JWT refresh:
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const res = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
          refresh,
        })
        localStorage.setItem('access_token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

**How to run the frontend:**
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

### ✅ Phase 0 Done When:
- [ ] `python manage.py runserver` runs without errors at `http://localhost:8000`
- [ ] `celery -A config worker --loglevel=info` starts without errors
- [ ] `npm run dev` opens React app at `http://localhost:5173`
- [ ] `redis-cli ping` returns `PONG`

---

## Feature 1 — Authentication

> **Done when:** Register → see activation token in terminal → paste it → login → see login alert in terminal → logout works.
>
> **Note on emails locally:** Since we use `console.EmailBackend`, all emails print to the **Django terminal** (Tab 1). You'll see the activation link, welcome message, and login alert printed there. No real email is sent. This is perfect for development.

### Step 1.1 — Model

**`users/models.py`:**
```python
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email              = models.EmailField(unique=True)
    full_name          = models.CharField(max_length=255)
    is_active          = models.BooleanField(default=False)   # False until email verified
    is_email_verified  = models.BooleanField(default=False)
    is_staff           = models.BooleanField(default=False)
    created_at         = models.DateTimeField(auto_now_add=True)
    last_login_at      = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    objects = UserManager()

    def __str__(self):
        return self.email


class EmailVerificationToken(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_token')
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()


class PasswordResetToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)


class LoginHistory(models.Model):
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    user_agent   = models.CharField(max_length=255, blank=True)
    logged_in_at = models.DateTimeField(auto_now_add=True)
```

```bash
python manage.py makemigrations users
python manage.py migrate
```

### Step 1.2 — Email Tasks (Celery)

> These print to your terminal locally because `EMAIL_BACKEND = console`.
> You'll copy the activation link from the terminal and paste it in the browser.

**`users/tasks.py`:**
```python
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
```

### Step 1.3 — Serializers

**`users/serializers.py`:**
```python
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    class Meta:
        model  = User
        fields = ['email', 'full_name', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)   # is_active=False by default


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'full_name', 'is_email_verified', 'created_at']
        read_only_fields = ['email', 'is_email_verified', 'created_at']
```

### Step 1.4 — Views

**`users/views.py`:**
```python
import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, EmailVerificationToken, PasswordResetToken, LoginHistory
from .serializers import RegisterSerializer, UserSerializer
from .tasks import (
    send_activation_email_task,
    send_welcome_email_task,
    send_login_alert_task,
    send_password_reset_task,
)

logger = logging.getLogger('users')


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token_obj = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        # This prints the activation email to your terminal (Tab 1)
        send_activation_email_task.delay(user.id, str(token_obj.token))
        logger.info(f'Registered: {user.email}')

        return Response(
            {'message': 'Registration successful! Check your terminal for the activation link.'},
            status=201
        )


class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get('token', '').strip()
        if not token_str:
            return Response({'error': 'Token is required.'}, status=400)

        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except EmailVerificationToken.DoesNotExist:
            return Response({'error': 'Invalid or already used link.'}, status=400)

        if timezone.now() > token_obj.expires_at:
            token_obj.delete()
            return Response({'error': 'Activation link expired. Please register again.'}, status=400)

        user = token_obj.user
        user.is_active = True
        user.is_email_verified = True
        user.save(update_fields=['is_active', 'is_email_verified'])
        token_obj.delete()
        send_welcome_email_task.delay(user.id)
        logger.info(f'Activated: {user.email}')

        return Response({'message': 'Account activated! You can now log in.'})


class ResendActivationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        try:
            user = User.objects.get(email=email, is_active=False)
            EmailVerificationToken.objects.filter(user=user).delete()
            token_obj = EmailVerificationToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            send_activation_email_task.delay(user.id, str(token_obj.token))
        except User.DoesNotExist:
            pass  # Don't reveal if email exists
        return Response({'message': 'If that email is unverified, a new link was sent to the terminal.'})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email or password.'}, status=401)

        if not user_obj.is_active:
            return Response({
                'error': 'Account not activated. Check your terminal for the activation link.',
                'resend_activation': True,
            }, status=403)

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'error': 'Invalid email or password.'}, status=401)

        refresh = RefreshToken.for_user(user)
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'localhost'))
        ua = request.META.get('HTTP_USER_AGENT', '')[:255]

        LoginHistory.objects.create(user=user, ip_address=ip, user_agent=ua)
        send_login_alert_task.delay(user.id, ip, ua)

        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])
        logger.info(f'Login: {user.email}')

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            return Response({'message': 'Logged out.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=400)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        try:
            user = User.objects.get(email=email, is_active=True)
            token_obj = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=1)
            )
            send_password_reset_task.delay(user.id, str(token_obj.token))
        except User.DoesNotExist:
            pass
        return Response({'message': 'Reset link sent to terminal if email is registered.'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str    = request.data.get('token', '')
        new_password = request.data.get('new_password', '')

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(
                token=token_str, is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid or expired reset link.'}, status=400)

        if timezone.now() > token_obj.expires_at:
            return Response({'error': 'Reset link has expired.'}, status=400)

        user = token_obj.user
        user.set_password(new_password)
        user.save()
        token_obj.is_used = True
        token_obj.save()
        return Response({'message': 'Password reset! You can now log in.'})
```

### Step 1.5 — URLs

**`users/urls.py`:**
```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/',           views.RegisterView.as_view()),
    path('activate/',           views.ActivateAccountView.as_view()),
    path('resend-activation/',  views.ResendActivationView.as_view()),
    path('login/',              views.LoginView.as_view()),
    path('logout/',             views.LogoutView.as_view()),
    path('token/refresh/',      TokenRefreshView.as_view()),
    path('me/',                 views.MeView.as_view()),
    path('forgot-password/',    views.ForgotPasswordView.as_view()),
    path('reset-password/',     views.ResetPasswordView.as_view()),
]
```

**`config/urls.py` — add auth:**
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    # More paths added as features are built
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Step 1.6 — Frontend Auth

**`src/store/authStore.js`:**
```javascript
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:            JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (tokens, user) => {
    localStorage.setItem('access_token',  tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore
```

**`src/api/auth.js`:**
```javascript
import api from './client'

export const authAPI = {
  register:          (data)  => api.post('/auth/register/', data),
  activate:          (token) => api.get(`/auth/activate/?token=${token}`),
  resendActivation:  (email) => api.post('/auth/resend-activation/', { email }),
  login:             (data)  => api.post('/auth/login/', data),
  logout:            (refresh) => api.post('/auth/logout/', { refresh }),
  refreshToken:      (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getMe:             ()      => api.get('/auth/me/'),
  updateMe:          (data)  => api.patch('/auth/me/', data),
  forgotPassword:    (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword:     (data)  => api.post('/auth/reset-password/', data),
}
```

**`src/components/ProtectedRoute.jsx`:**
```jsx
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
```

**`src/pages/auth/RegisterPage.jsx`:**
```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth'

export default function RegisterPage() {
  const [form, setForm]       = useState({ full_name: '', email: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authAPI.register(form)
      setDone(true)
    } catch (err) {
      const d = err.response?.data
      if (d) Object.values(d).flat().forEach(m => toast.error(String(m)))
      else toast.error('Registration failed')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full text-center">
        <div className="text-5xl mb-4">🖥️</div>
        <h2 className="text-xl font-bold mb-2">Check your terminal!</h2>
        <p className="text-gray-600 text-sm mb-4">
          The activation link was printed to your Django terminal (Tab 1).
          Copy the URL and open it in your browser.
        </p>
        <p className="text-xs text-gray-400">
          Didn't see it?{' '}
          <button onClick={() => authAPI.resendActivation(form.email).then(() => toast.success('Resent to terminal!'))}
            className="underline text-blue-600">Resend</button>
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Activation link will appear in your terminal</p>
        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Full Name', name: 'full_name', type: 'text' },
            { label: 'Email',     name: 'email',     type: 'email' },
            { label: 'Password',  name: 'password',  type: 'password' },
            { label: 'Confirm Password', name: 'password2', type: 'password' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handle} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

**`src/pages/auth/ActivatePage.jsx`:**
```jsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '../../api/auth'

export default function ActivatePage() {
  const [params]  = useSearchParams()
  const [status,  setStatus]  = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('No token in URL.'); return }
    authAPI.activate(token)
      .then(r => { setStatus('success'); setMessage(r.data.message) })
      .catch(e => { setStatus('error');   setMessage(e.response?.data?.error || 'Activation failed.') })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full text-center">
        {status === 'loading' && <p className="text-gray-500">Activating...</p>}
        {status === 'success' && <>
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-xl font-bold mb-2">Account Activated!</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg inline-block">
            Go to Login
          </Link>
        </>}
        {status === 'error' && <>
          <div className="text-5xl mb-3">❌</div>
          <h2 className="text-xl font-bold mb-2">Activation Failed</h2>
          <p className="text-red-600 mb-4 text-sm">{message}</p>
          <Link to="/register" className="text-blue-600 underline text-sm">Register again</Link>
        </>}
      </div>
    </div>
  )
}
```

**`src/pages/auth/LoginPage.jsx`:**
```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const navigate        = useNavigate()
  const login           = useAuthStore(s => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [notActivated,  setNotActivated] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotActivated(false)
    try {
      const res = await authAPI.login(form)
      login({ access: res.data.access, refresh: res.data.refresh }, res.data.user)
      toast.success(`Welcome back, ${res.data.user.full_name}!`)
      navigate('/dashboard')
    } catch (err) {
      const d = err.response?.data
      if (d?.resend_activation) setNotActivated(true)
      else toast.error(d?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  const resend = async () => {
    try {
      await authAPI.resendActivation(form.email)
      toast.success('Activation link printed to terminal!')
    } catch { toast.error('Resend failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">Login alerts appear in your terminal</p>

        {notActivated && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-sm text-yellow-800">
            Account not activated.{' '}
            <button onClick={resend} className="underline font-medium">Resend link to terminal</button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Email',    name: 'email',    type: 'email' },
            { label: 'Password', name: 'password', type: 'password' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handle} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-blue-600">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          No account? <Link to="/register" className="text-blue-600">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```

**`src/App.jsx` — starter router (add routes as features are built):**

> **Note:** The `"/"` root uses a smart redirect — unauthenticated users see the landing page (built in Feature 2b), logged-in users go straight to `/dashboard`. Do **not** import `LandingPage` here yet — add that import after Feature 2b is complete.

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute     from './components/ProtectedRoute'
import RegisterPage       from './pages/auth/RegisterPage'
import ActivatePage       from './pages/auth/ActivatePage'
import LoginPage          from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'
import DashboardPage      from './pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/activate"        element={<ActivatePage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected — more added as features are built */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />

      {/* Root — redirects to /dashboard for now; replaced in Feature 2b */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
```

### ✅ Feature 1 Done When:
- [ ] Register → see activation URL printed in Django terminal
- [ ] Paste URL in browser → "Account Activated" page
- [ ] Welcome message printed in Django terminal
- [ ] Login → lands on dashboard
- [ ] Login alert printed in Django terminal
- [ ] Unactivated login → shows resend option
- [ ] Forgot password → reset link printed in terminal
- [ ] Logout clears tokens and redirects to /login

---

## Feature 2 — Dashboard Shell

> **Done when:** After login you see a sidebar with all nav links and a dashboard with placeholder stat cards.
> The stat numbers will be 0 or "—" until other features are built — that is correct.

### Step 2.1 — Backend: Dashboard API

**`analytics/views.py`:**
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count


class DashboardView(APIView):
    def get(self, request):
        user = request.user

        # Application stats — safe defaults until Feature 5 is built
        app_stats = {'total': 0, 'by_status': {}, 'response_rate': 0}
        try:
            from applications.models import JobApplication
            qs = JobApplication.objects.filter(user=user)
            total = qs.count()
            by_status = dict(qs.values_list('status').annotate(c=Count('id')))
            past = sum(v for k, v in by_status.items() if k in ['SCREENING', 'INTERVIEW', 'OFFER'])
            app_stats = {
                'total': total,
                'by_status': by_status,
                'response_rate': round(past / total * 100, 1) if total else 0,
            }
        except Exception:
            pass

        # Active resume — safe default until Feature 3 is built
        active_resume = None
        try:
            from resumes.models import Resume
            r = Resume.objects.filter(user=user, is_active=True).first()
            if r:
                ats = None
                try:
                    ats = r.analysis.ats_score if r.analysis.status == 'DONE' else None
                except Exception:
                    pass
                active_resume = {
                    'id': r.id,
                    'version_name': r.version_name,
                    'ats_score': ats,
                    'parse_status': r.parse_status,
                }
        except Exception:
            pass

        return Response({
            'application_stats': app_stats,
            'active_resume':     active_resume,
            'top_skill_gaps':    [],    # filled in Feature 12
            'pending_hil':       0,     # filled in Features 10/11
        })
```

**`analytics/urls.py`:**
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.DashboardView.as_view()),
]
```

Add to `config/urls.py`:
```python
path('api/dashboard/', include('analytics.urls')),
```

### Step 2.2 — Frontend: Layout + Dashboard

**`src/components/layout/Sidebar.jsx`:**
```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Briefcase, Kanban,
  BarChart2, Wand2, FileEdit, Star, LogOut, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { authAPI } from '../../api/auth'

const NAV = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resumes',             icon: FileText,        label: 'Resumes' },
  { to: '/job-descriptions',    icon: Briefcase,       label: 'Job Descriptions' },
  { to: '/applications',        icon: Kanban,          label: 'Applications' },
  { to: '/job-recommendations', icon: Star,            label: 'Job Recs' },
  { to: '/cv-generator',        icon: Wand2,           label: 'CV Generator' },
  { to: '/resume-generator',    icon: FileEdit,        label: 'Resume Generator' },
  { to: '/analytics',           icon: BarChart2,       label: 'Analytics' },
]

export default function Sidebar() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await authAPI.logout(refresh) } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <aside className="w-60 bg-white border-r min-h-screen flex flex-col shrink-0">
      <div className="p-5 border-b">
        <h1 className="text-lg font-bold text-blue-600">JobTracker</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={14} className="text-blue-600" />
          </div>
          <p className="text-xs text-gray-600 truncate">{user?.full_name}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}
```

**`src/components/layout/AppLayout.jsx`:**
```jsx
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

**`src/pages/DashboardPage.jsx`:**
```jsx
import { useQuery } from '@tanstack/react-query'
import AppLayout from '../components/layout/AppLayout'
import api from '../api/client'
import useAuthStore from '../store/authStore'

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-700',
    green:  'bg-green-50  text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color].split(' ')[1]}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const QUICK_ACTIONS = [
  { emoji: '📄', label: 'Upload Resume',        href: '/resumes' },
  { emoji: '📋', label: 'Add Job Description',  href: '/job-descriptions' },
  { emoji: '📌', label: 'Add Application',      href: '/applications' },
  { emoji: '⭐', label: 'Get Job Recs',         href: '/job-recommendations' },
  { emoji: '✨', label: 'Generate CV',           href: '/cv-generator' },
  { emoji: '📝', label: 'Generate Resume',       href: '/resume-generator' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(r => r.data),
    refetchInterval: 30000,
  })

  const stats  = data?.application_stats || {}
  const resume = data?.active_resume

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your job search overview</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Applications" value={stats.total || 0} color="blue" />
        <StatCard label="Response Rate"
          value={stats.response_rate ? `${stats.response_rate}%` : '0%'}
          color="green" />
        <StatCard label="Interviews"
          value={stats.by_status?.INTERVIEW || 0}
          color="purple" />
        <StatCard label="ATS Score"
          value={resume?.ats_score != null ? `${resume.ats_score}/100` : null}
          sub={resume ? resume.version_name : 'Upload a resume'}
          color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ emoji, label, href }) => (
              <a key={href} href={href}
                className="flex items-center gap-2 border rounded-lg p-3 text-sm text-gray-700
                           hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <span className="text-lg">{emoji}</span>
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Application Status Breakdown */}
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h2 className="font-semibold mb-4">Applications by Status</h2>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : Object.keys(stats.by_status || {}).length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No applications yet.</p>
              <a href="/applications" className="text-blue-600 text-sm underline mt-1 inline-block">
                Add your first application →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((count / stats.total) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
```

### ✅ Feature 2 Done When:
- [ ] Login → see dashboard with your name
- [ ] Sidebar shows all navigation links
- [ ] Stats show 0/— (correct until other features are built)
- [ ] Quick action links are clickable (pages don't exist yet — that's OK)
- [ ] Logout from sidebar works

---

## Feature 2b — Public Landing Page (App Showcase)

> **Purpose:** When a brand-new user visits `http://localhost:5173`, instead of being silently
> redirected to `/login` with no context, they land on a page that clearly communicates what
> the app does, highlights all 5 AI agents, and gives them a strong reason to sign up.
>
> **Done when:** Visiting `http://localhost:5173` without being logged in shows the landing page.
> Visiting it while already logged in redirects straight to `/dashboard`.

### Why this page matters

The user-level dashboard only has meaning once someone is logged in and has data. A first-time
visitor hitting `/` would otherwise see a login form with zero explanation of what they're signing
up for. This page solves that by answering three questions in under 10 seconds:

| Question | Answered by |
|---|---|
| What is this? | Hero headline + sub-heading |
| Why should I care? | 5 AI agent cards |
| How do I start? | CTA buttons → `/register` |

This is also a zero-backend change — pure frontend, no new API endpoints needed.

---

### Step 2b.1 — Update `App.jsx` with Smart Root Redirect

Replace the `"/"` route with a component that checks auth state: unauthenticated users see
the landing page, logged-in users go to `/dashboard`.

**`src/App.jsx` — final version (replaces the starter version from Feature 1):**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute     from './components/ProtectedRoute'
import RegisterPage       from './pages/auth/RegisterPage'
import ActivatePage       from './pages/auth/ActivatePage'
import LoginPage          from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'
import DashboardPage      from './pages/DashboardPage'
import LandingPage        from './pages/LandingPage'
import useAuthStore       from './store/authStore'

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <LandingPage />
}

export default function App() {
  return (
    <Routes>
      {/* Root — smart: landing page for guests, dashboard for logged-in users */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/activate"        element={<ActivatePage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected — more routes added as features are built */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
    </Routes>
  )
}
```

---

### Step 2b.2 — Create `src/pages/LandingPage.jsx`

This is the only new file for this feature. Create it at `src/pages/LandingPage.jsx`:

```jsx
import { Link } from 'react-router-dom'
import {
  FileText, Briefcase, Brain, Wand2, FileEdit,
  Star, BarChart2, Kanban, CheckCircle2, ArrowRight,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    icon: FileText,
    color: 'blue',
    title: 'Resume Analyzer',
    description:
      'Upload your PDF resume and get an instant ATS score, skill extraction, ' +
      'strengths/weaknesses breakdown, and formatting feedback — powered by Gemini.',
  },
  {
    icon: Briefcase,
    color: 'indigo',
    title: 'JD Analyzer',
    description:
      'Paste any job description and the agent extracts required skills, ' +
      'seniority level, company type, and key responsibilities in seconds.',
  },
  {
    icon: Star,
    color: 'purple',
    title: 'Job Recommender',
    description:
      'Based on your resume and the JDs you\'ve added, the agent ranks your ' +
      'top 5 best-fit applications so you focus your energy where it counts.',
  },
  {
    icon: Wand2,
    color: 'pink',
    title: 'CV Generator',
    description:
      'AI drafts a tailored CV section by section for a specific job. ' +
      'You review and approve each part before anything is finalised — ' +
      'human-in-the-loop by design.',
  },
  {
    icon: FileEdit,
    color: 'orange',
    title: 'Resume Generator',
    description:
      'Generate a role-specific, ATS-optimised resume from scratch. ' +
      'The AI proposes each bullet — you approve, edit, or reject ' +
      'before it is saved.',
  },
]

const FEATURES = [
  {
    icon: Kanban,
    label: 'Kanban application board',
    desc: 'Track every application through Applied → Screening → Interview → Offer with drag-and-drop.',
  },
  {
    icon: Brain,
    label: 'AI resume scoring',
    desc: 'See exactly how well your resume matches each job description before you apply.',
  },
  {
    icon: BarChart2,
    label: 'Analytics dashboard',
    desc: 'Response rate, skill gaps, rejection correlation, and weekly application velocity — all in one place.',
  },
  {
    icon: CheckCircle2,
    label: 'Human-in-the-loop AI',
    desc: 'Every AI-generated document goes through your review and approval before it is saved.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload your resume',
    desc: 'Drop your PDF. The Resume Analyzer scores it against ATS criteria and extracts all your skills automatically.',
  },
  {
    step: '02',
    title: 'Add job descriptions',
    desc: 'Paste any JD. The JD Analyzer structures it and instantly shows how well your resume fits that specific role.',
  },
  {
    step: '03',
    title: 'Let the agents work',
    desc: 'Get job recommendations, generate tailored CVs, track every application on a Kanban board, and review analytics.',
  },
]

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  pink:   { bg: 'bg-pink-50',   icon: 'text-pink-600',   badge: 'bg-pink-100 text-pink-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ── */}
      <nav className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">JobTracker AI</span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium
                        px-3 py-1 rounded-full mb-6">
          <Brain size={12} />
          5 AI Agents · LangGraph · Gemini · ChromaDB
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-5">
          Your AI-powered<br />
          <span className="text-blue-600">job search co-pilot</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Stop tracking jobs in spreadsheets. JobTracker AI analyzes your resume,
          dissects job descriptions, scores your fit, and generates tailored CVs —
          all while keeping you in control.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3
                       rounded-xl font-semibold hover:bg-blue-700 text-base"
          >
            Start for free <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl border font-semibold text-gray-600
                       hover:bg-gray-50 text-base"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── 5 AI Agents ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-2">5 AI Agents working for you</h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Each agent is a specialist — powered by Gemini and orchestrated with LangGraph
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map(({ icon: Icon, color, title, description }, i) => {
              const c = COLOR_MAP[color]
              return (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
                    <Icon size={20} className={c.icon} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base">{title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                      Agent {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              )
            })}

            {/* 6th card — everything else summary */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-3">Everything else you need</h3>
                <ul className="text-sm text-blue-100 space-y-1.5">
                  <li>✓ Kanban application board</li>
                  <li>✓ Resume match scoring per job</li>
                  <li>✓ Analytics — gaps, velocity, funnel</li>
                  <li>✓ JWT auth with email activation</li>
                  <li>✓ Human-in-the-loop review flows</li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold
                           underline underline-offset-2 text-white hover:text-blue-200"
              >
                Get started <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Built for serious job seekers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex gap-4 p-5 border rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center
                                justify-center font-bold text-sm mb-4">
                  {step}
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to find your next role?</h2>
        <p className="text-gray-500 mb-8">
          Free to use. No cloud setup needed — runs entirely on your machine.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5
                     rounded-xl font-semibold hover:bg-blue-700 text-base"
        >
          Create your account <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-6 text-center text-xs text-gray-400">
        JobTracker AI · Built with Django · React · LangGraph · Gemini API
      </footer>

    </div>
  )
}
```

---

### Step 2b.3 — Add `LandingPage` to File Structure Reference

In the complete file structure at the bottom of the plan, `LandingPage.jsx` lives here:

```
frontend/src/pages/
├── auth/
│   ├── RegisterPage.jsx
│   ├── ActivatePage.jsx
│   ├── LoginPage.jsx
│   ├── ForgotPasswordPage.jsx
│   └── ResetPasswordPage.jsx
├── LandingPage.jsx          ← NEW (Feature 2b)
├── DashboardPage.jsx
└── ...
```

---

### ✅ Feature 2b Done When:
- [ ] Visiting `http://localhost:5173` without being logged in → landing page appears (not login)
- [ ] Logged-in users visiting `http://localhost:5173` → redirected to `/dashboard` automatically
- [ ] Sticky navbar shows "Sign in" and "Get started free" buttons — both links work
- [ ] All 5 agent cards are visible with correct titles, "Agent N" badge, and descriptions
- [ ] Blue summary card (6th card) lists the remaining features
- [ ] "How it works" 3-step section is visible
- [ ] Final CTA button links to `/register`
- [ ] No backend changes needed — this is frontend only

---

## Feature 3 — Resume Upload & Management

> **Local storage:** Resumes are saved in `backend/media/resumes/` on your computer.
> No S3 needed.
> **Done when:** Upload a PDF, see it in the list, set it as active, view it.

### Step 3.1 — Model

**`resumes/models.py`:**
```python
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
    uploaded_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.user.email} — {self.version_name}'
```

```bash
python manage.py makemigrations resumes
python manage.py migrate
```

### Step 3.2 — Celery Task (Local PDF Text Extraction)

**`resumes/tasks.py`:**
```python
import io
import logging
import PyPDF2
from celery import shared_task
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger('resumes')


def extract_text_from_local_pdf(file_path):
    """Read PDF from local filesystem and extract text."""
    full_path = settings.MEDIA_ROOT / str(file_path)
    with open(full_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = '\n'.join(page.extract_text() or '' for page in reader.pages)
    return text.strip()


def chunk_text(text, chunk_size=400, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


def embed_resume_in_chromadb(resume):
    """Store resume text chunks in local ChromaDB."""
    import chromadb
    from chromadb.utils import embedding_functions

    client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name='BAAI/bge-small-en-v1.5'
    )
    collection_name = f'resume_u{resume.user_id}_r{resume.id}'
    collection = client.get_or_create_collection(name=collection_name, embedding_function=ef)

    chunks = chunk_text(resume.raw_text)
    if not chunks:
        return

    collection.add(
        documents=chunks,
        ids=[f'chunk_{resume.id}_{i}' for i in range(len(chunks))],
        metadatas=[{'resume_id': str(resume.id), 'chunk_index': i} for i in range(len(chunks))],
    )
    logger.info(f'ChromaDB: embedded {len(chunks)} chunks for resume {resume.id}')


@shared_task(bind=True, max_retries=3)
def process_resume_task(self, resume_id):
    """Extract text → embed in ChromaDB → trigger analysis agent (added in Feature 6)."""
    from resumes.models import Resume
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.parse_status = 'PROCESSING'
        resume.save(update_fields=['parse_status'])

        # Extract text from local file
        text = extract_text_from_local_pdf(resume.file.name)
        if not text:
            raise ValueError('PDF text extraction returned empty. Is this a scanned PDF?')

        resume.raw_text = text
        resume.save(update_fields=['raw_text'])

        # Embed in local ChromaDB
        embed_resume_in_chromadb(resume)
        resume.embedded_at = timezone.now()
        resume.parse_status = 'DONE'
        resume.save(update_fields=['embedded_at', 'parse_status'])

        # Trigger analyzer (safe — skipped if agent not built yet)
        try:
            from ai_engine.tasks import analyze_resume_task
            analyze_resume_task.delay(resume_id)
        except ImportError:
            pass

        logger.info(f'Resume processed successfully: {resume_id}')

    except Exception as exc:
        from resumes.models import Resume as R
        R.objects.filter(id=resume_id).update(parse_status='FAILED')
        logger.error(f'Resume processing failed [{resume_id}]: {exc}')
        raise self.retry(exc=exc, countdown=30)
```

### Step 3.3 — Serializer + Views + URLs

**`resumes/serializers.py`:**
```python
from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    analysis = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = Resume
        fields = ['id', 'version_name', 'original_filename', 'is_active',
                  'parse_status', 'embedded_at', 'uploaded_at', 'file_url', 'analysis']
        read_only_fields = ['id', 'uploaded_at', 'embedded_at', 'parse_status']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_analysis(self, obj):
        try:
            a = obj.analysis
            return {
                'status':            a.status,
                'ats_score':         a.ats_score if a.status == 'DONE' else None,
                'skills_detected':   a.skills_detected if a.status == 'DONE' else [],
                'strengths':         a.strengths if a.status == 'DONE' else [],
                'weaknesses':        a.weaknesses if a.status == 'DONE' else [],
                'formatting_issues': a.formatting_issues if a.status == 'DONE' else [],
                'ats_feedback':      a.ats_feedback if a.status == 'DONE' else '',
                'error_message':     a.error_message,
            }
        except Exception:
            return None
```

**`resumes/views.py`:**
```python
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import Resume
from .serializers import ResumeSerializer
from .tasks import process_resume_task


class ResumeUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file         = request.FILES.get('resume')
        version_name = request.data.get('version_name', 'Default').strip() or 'Default'

        if not file:
            return Response({'error': 'No file provided.'}, status=400)
        if not file.name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files are accepted.'}, status=400)
        if file.size > 5 * 1024 * 1024:
            return Response({'error': 'File must be under 5MB.'}, status=400)

        # Deactivate existing active resume
        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)

        resume = Resume.objects.create(
            user=request.user,
            file=file,
            original_filename=file.name,
            version_name=version_name,
            is_active=True,
            parse_status='PENDING',
        )
        process_resume_task.delay(resume.id)

        return Response(ResumeSerializer(resume, context={'request': request}).data, status=201)


class ResumeListView(ListAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class ResumeDetailView(RetrieveAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class ResumeActivateView(APIView):
    def patch(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
        resume.is_active = True
        resume.save(update_fields=['is_active'])
        return Response(ResumeSerializer(resume, context={'request': request}).data)


class ResumeDeleteView(APIView):
    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if resume.is_active:
            return Response({'error': 'Cannot delete the active resume. Activate another first.'}, status=400)

        resume.file.delete(save=False)   # delete local file from media/
        resume.delete()
        return Response(status=204)


class ResumeReanalyzeView(APIView):
    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        try:
            from ai_engine.tasks import analyze_resume_task
            analyze_resume_task.delay(resume.id)
            return Response({'status': 'queued'})
        except ImportError:
            return Response({'error': 'Analyzer agent not built yet.'}, status=503)
```

**`resumes/urls.py`:**
```python
from django.urls import path
from . import views

urlpatterns = [
    path('upload/',              views.ResumeUploadView.as_view()),
    path('',                     views.ResumeListView.as_view()),
    path('<int:pk>/',            views.ResumeDetailView.as_view()),
    path('<int:pk>/activate/',   views.ResumeActivateView.as_view()),
    path('<int:pk>/delete/',     views.ResumeDeleteView.as_view()),
    path('<int:pk>/reanalyze/',  views.ResumeReanalyzeView.as_view()),
]
```

Add to `config/urls.py`:
```python
path('api/resumes/', include('resumes.urls')),
```

### Step 3.4 — Frontend Pages

**`src/api/resumes.js`:**
```javascript
import api from './client'

export const resumeAPI = {
  upload:    (formData) => api.post('/resumes/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list:      ()   => api.get('/resumes/'),
  get:       (id) => api.get(`/resumes/${id}/`),
  activate:  (id) => api.patch(`/resumes/${id}/activate/`),
  delete:    (id) => api.delete(`/resumes/${id}/delete/`),
  reanalyze: (id) => api.post(`/resumes/${id}/reanalyze/`),
}
```

Build `src/pages/ResumesPage.jsx` with:
- List of all resumes (cards showing version name, filename, status badge, ATS score if done)
- Upload modal (version name input + file picker)
- Set Active / Delete buttons per card
- "Processing…" auto-refreshes every 3 seconds until status is DONE/FAILED

```javascript
// Auto-refresh until processing done
const { data } = useQuery({
  queryKey: ['resumes'],
  queryFn: () => resumeAPI.list().then(r => r.data),
  refetchInterval: (data) => {
    const anyProcessing = data?.some(r => r.parse_status === 'PROCESSING' || r.parse_status === 'PENDING')
    return anyProcessing ? 3000 : false
  },
})
```

Add to `App.jsx`:
```jsx
import ResumesPage from './pages/ResumesPage'
// inside <Routes>:
<Route path="/resumes" element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
```

### ✅ Feature 3 Done When:
- [ ] Upload PDF → file saved in `backend/media/resumes/`
- [ ] Celery task runs (watch Tab 2 terminal)
- [ ] Status badge shows PENDING → PROCESSING → DONE
- [ ] Active resume shown with highlight
- [ ] Set Active button switches active resume
- [ ] Delete (non-active) removes file from disk and database

---

## Feature 4 — Job Description Management

> **Done when:** Paste a JD, save it, see it in a list, view structured fields (analysis shows PENDING until Feature 7 is built).

Follow the same pattern as Feature 3:

**Model:** `job_descriptions/models.py`
```python
# JobDescription: user, title, company_name, raw_text, source_url, is_archived, created_at
# JDAnalysis (OneToOne → JobDescription):
#   required_skills (JSONField), nice_to_have_skills (JSONField),
#   seniority_level, company_type, key_responsibilities (JSONField),
#   years_of_experience, role_summary, parsed_at,
#   status (PENDING|PROCESSING|DONE|FAILED), error_message
```

**Views pattern:**
- `JobDescriptionListCreateView` — list all JDs for user, create new (auto-queues JD analysis task)
- `JobDescriptionDetailView` — retrieve + update + archive
- `JobDescriptionReanalyzeView` — POST to re-queue analysis

**Frontend pages:**
- `/job-descriptions` — list with search/filter, "Add JD" button
- JD form modal — fields: Title, Company Name, Paste JD Text, Source URL (optional)
- `/job-descriptions/:id` — shows raw text + analysis result (required skills chips, nice-to-have chips, seniority badge)

Analysis result shows "Analysis pending..." until Feature 7 (JD Analyzer Agent) is built.

### ✅ Feature 4 Done When:
- [ ] Create JD with title, company, raw text
- [ ] JD appears in list
- [ ] JD detail shows raw text and "Analysis Pending" status
- [ ] Archive JD removes it from main list

---

## Feature 5 — Job Applications (Kanban Board)

> **Done when:** Add an application, drag it between status columns, view its detail page.

**Model:** `applications/models.py`
```python
# JobApplication:
#   user, jd (FK→JobDescription, null), company_name, role_title, job_url,
#   status (APPLIED|SCREENING|INTERVIEW|OFFER|REJECTED|WITHDRAWN),
#   jd_raw_text (text, blank), applied_date, last_updated (auto), notes,
#   source (LinkedIn|Naukri|Company Website|Referral|Other),
#   was_selected_for_interview (bool, null)
#
# ResumeScore:
#   application (FK→JobApplication), resume (FK→Resume),
#   score (int), confidence (int), matched_skills (JSON), missing_skills (JSON),
#   user_edited_missing (JSON, null), summary (text), scored_at,
#   status (PENDING|PROCESSING|DONE|FAILED), error_message
#
# Tag: user, name
# Reminder: application, due_date, message, is_dismissed, email_sent, created_at
```

**Frontend Kanban:** Use `@hello-pangea/dnd` (the maintained fork of react-beautiful-dnd) for drag-and-drop columns.

```
APPLIED → SCREENING → INTERVIEW → OFFER → REJECTED → WITHDRAWN
```

Each card shows: Company, Role, Source badge, Resume Score (if available).
Dragging a card calls `PATCH /api/applications/:id/` to update `status`.

### ✅ Feature 5 Done When:
- [ ] Add application via modal
- [ ] Applications appear in correct column
- [ ] Drag card to different column → status updates in database
- [ ] Click card → detail page with notes, JD link, score section (empty until Feature 8)

---

## Feature 6 — Agent 1: Resume Analyzer

> **Done when:** Upload a resume → wait → see ATS score, skills, strengths, weaknesses in Resume detail page.

### Step 6.1 — Model (add to ai_engine)

**`ai_engine/models.py`:**
```python
from django.db import models

class ResumeAnalysis(models.Model):
    STATUS = [('PENDING','Pending'),('PROCESSING','Processing'),('DONE','Done'),('FAILED','Failed')]

    resume           = models.OneToOneField('resumes.Resume', on_delete=models.CASCADE, related_name='analysis')
    skills_detected  = models.JSONField(default=list)
    experience_years = models.IntegerField(default=0)
    strengths        = models.JSONField(default=list)
    weaknesses       = models.JSONField(default=list)
    ats_score        = models.IntegerField(default=0)
    ats_feedback     = models.TextField(blank=True)
    formatting_issues= models.JSONField(default=list)
    analysed_at      = models.DateTimeField(null=True, blank=True)
    status           = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    error_message    = models.TextField(blank=True, null=True)
```

```bash
python manage.py makemigrations ai_engine
python manage.py migrate
```

### Step 6.2 — LangGraph Agent

**`ai_engine/agents/resume_analyzer.py`:**
```python
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from typing import List, TypedDict
from django.conf import settings


class ResumeAnalysisOutput(BaseModel):
    skills_detected:   List[str]
    experience_years:  int
    strengths:         List[str]
    weaknesses:        List[str]
    ats_score:         int           # 0–100
    ats_feedback:      str           # 2–3 sentences
    formatting_issues: List[str]


class ResumeState(TypedDict):
    resume_text: str
    analysis:    dict
    error:       str


def analyze_node(state: ResumeState) -> ResumeState:
    llm = ChatGoogleGenerativeAI(
        model='gemini-1.5-flash',
        temperature=0.1,
        google_api_key=settings.GOOGLE_API_KEY,
    ).with_structured_output(ResumeAnalysisOutput)

    prompt = f"""
You are an expert ATS (Applicant Tracking System) and resume analyst.
Analyze the resume below carefully.

RESUME TEXT:
{state['resume_text'][:6000]}

Instructions:
- List every technical and soft skill explicitly mentioned
- Estimate total years of professional experience
- Identify 3–5 concrete strengths (be specific, not generic)
- Identify 3–5 actionable weaknesses or improvement areas
- Give an ATS score (0–100) based on: keyword density, formatting clarity,
  quantified results, completeness of sections, and readability
- Flag formatting issues that ATS systems struggle with
  (e.g. tables, columns, images, non-standard headings, headers/footers)
"""
    result = llm.invoke(prompt)
    return {**state, 'analysis': result.model_dump()}


def validate_node(state: ResumeState) -> ResumeState:
    if not state['analysis'].get('skills_detected'):
        return {**state, 'error': 'No skills detected — resume may be empty or unreadable.'}
    return state


def build_resume_analyzer():
    g = StateGraph(ResumeState)
    g.add_node('analyze',  analyze_node)
    g.add_node('validate', validate_node)
    g.set_entry_point('analyze')
    g.add_edge('analyze',  'validate')
    g.add_edge('validate', END)
    return g.compile()


RESUME_ANALYZER = build_resume_analyzer()
```

### Step 6.3 — Celery Task

**`ai_engine/tasks.py`:**
```python
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger('ai_engine')


@shared_task(bind=True, max_retries=3)
def analyze_resume_task(self, resume_id):
    from resumes.models import Resume
    from ai_engine.models import ResumeAnalysis
    from ai_engine.agents.resume_analyzer import RESUME_ANALYZER

    try:
        resume = Resume.objects.get(id=resume_id)
        if not resume.raw_text.strip():
            logger.warning(f'Resume {resume_id} has no text — skipping analysis')
            return

        analysis, _ = ResumeAnalysis.objects.get_or_create(resume=resume)
        analysis.status = 'PROCESSING'
        analysis.error_message = None
        analysis.save()

        result = RESUME_ANALYZER.invoke({
            'resume_text': resume.raw_text,
            'analysis':    {},
            'error':       '',
        })

        if result.get('error'):
            raise ValueError(result['error'])

        data = result['analysis']
        analysis.skills_detected   = data['skills_detected']
        analysis.experience_years  = data['experience_years']
        analysis.strengths         = data['strengths']
        analysis.weaknesses        = data['weaknesses']
        analysis.ats_score         = data['ats_score']
        analysis.ats_feedback      = data['ats_feedback']
        analysis.formatting_issues = data['formatting_issues']
        analysis.status            = 'DONE'
        analysis.analysed_at       = timezone.now()
        analysis.save()
        logger.info(f'Resume analyzed [{resume_id}] — ATS: {data["ats_score"]}')

    except Exception as exc:
        from ai_engine.models import ResumeAnalysis as RA
        RA.objects.filter(resume_id=resume_id).update(status='FAILED', error_message=str(exc))
        logger.error(f'Resume analysis failed [{resume_id}]: {exc}')
        raise self.retry(exc=exc, countdown=30)
```

The Resume detail page in Feature 3 already reads `resume.analysis` from the serializer — once this agent runs, the ATS score, skills, strengths, and weaknesses appear automatically.

### ✅ Feature 6 Done When:
- [ ] Upload resume → Celery calls analyze_resume_task
- [ ] Watch Celery terminal (Tab 2) — see "Resume analyzed" log
- [ ] Go to Resume detail → see ATS score ring, skills chips, strengths/weaknesses
- [ ] "Re-analyze" button works
- [ ] Failed analysis shows error message + retry option

---

## Feature 7 — Agent 2: JD Analyzer

Follow the same pattern as Feature 6:

**Agent:** `ai_engine/agents/jd_analyzer.py`

```python
# Output model: JDAnalysisOutput
#   required_skills: List[str]
#   nice_to_have_skills: List[str]
#   seniority_level: str   (Junior | Mid | Senior | Lead)
#   company_type: str      (Startup | MNC | Product | Service | Unknown)
#   key_responsibilities: List[str]
#   years_of_experience: int | None
#   role_summary: str      (1-sentence summary)

# Graph: parse_node → validate_node → END
# Prompt: extract structured fields from raw JD text
#         Only include skills explicitly mentioned — do not infer
```

**Task:** `analyze_jd_task(jd_id)` in `ai_engine/tasks.py`
- Gets `JobDescription.raw_text`
- Runs JD_ANALYZER agent
- Saves results to `JDAnalysis` model (status DONE)
- Chains `score_resume_task` if user has an embedded active resume

**Endpoint:** `POST /api/job-descriptions/:id/reanalyze/`

Once this is built, the JD detail page (Feature 4) automatically shows the structured fields.

### ✅ Feature 7 Done When:
- [ ] Create JD → Celery auto-runs analysis
- [ ] JD detail page shows required skills, nice-to-have, seniority, responsibilities
- [ ] Editing JD text and re-analyzing updates the fields
- [ ] Short/poor JD text shows error message

---

## Feature 8 — Resume Scoring (Match Resume vs JD)

> **Done when:** On an Application detail page, you see a 0–100 match score with matched/missing skills.

### How it works:
1. User creates an application (linked to a JD or with raw JD text)
2. `score_resume_task` runs automatically after JD is parsed
3. Uses ChromaDB to retrieve relevant resume chunks for the JD's skills
4. Gemini scores the match and returns structured JSON

**Celery Task:** `ai_engine/tasks.py`
```python
@shared_task(bind=True, max_retries=3)
def score_resume_task(self, application_id):
    # 1. Get application, JDAnalysis (must be DONE), active Resume (must be embedded)
    # 2. Query ChromaDB: retrieve top 6 chunks relevant to required_skills
    # 3. Ask Gemini to score match (0–100), confidence, matched_skills, missing_skills, summary
    # 4. Save to ResumeScore model
    # JSON prompt → parse response → save
```

**Frontend:** Application detail page shows:
- Score ring (big number 0–100)
- Confidence indicator
- Matched skills (green chips)
- Missing skills (orange chips — editable by user)
- AI summary paragraph
- "Re-score" button

### ✅ Feature 8 Done When:
- [ ] Create application → score appears after ~10 seconds
- [ ] Score shows matched and missing skills
- [ ] User can edit missing skills (saved to `user_edited_missing`)
- [ ] Re-score button works

---

## Feature 9 — Agent 3: Job Recommender (Top 5 Jobs)

> **Done when:** A dedicated page shows 5 recommended job roles based on your resume + optional JD context.

**Agent:** `ai_engine/agents/job_recommender.py`

```python
# Output: 5 JobRecommendation objects, each with:
#   title, company_type, match_score, match_reason,
#   key_skills_to_highlight, skill_gaps_to_address,
#   suggested_search_query (for LinkedIn/Naukri)

# Graph: recommend_node → END
# Input: resume analysis data + optional JD analysis data
```

**Task:** `recommend_jobs_task(resume_id, jd_id=None)`

**Model:** `ai_engine/models.py` — add `JobRecommendation`
```python
# JobRecommendation:
#   resume (FK), jd (FK, null), recommended_jobs (JSONField),
#   generated_at, status (PENDING|PROCESSING|DONE|FAILED)
```

**Frontend Page `/job-recommendations`:**
```
Select Resume (dropdown)
Optional: Select a JD for context
"Get Recommendations" button

Results (5 cards):
  ┌─────────────────────────────────────────┐
  │ Role Title         [Match: 87/100]       │
  │ Company Type: Product Startup            │
  │ Why you fit: 2-line explanation          │
  │ ✅ Highlight: Python, FastAPI, Redis     │
  │ 📚 Learn: Kubernetes, AWS ECS            │
  │ 🔍 Search: "Senior Backend Python..."   │
  └─────────────────────────────────────────┘
```

### ✅ Feature 9 Done When:
- [ ] Select resume → click "Get Recommendations" → 5 job cards appear
- [ ] Each card shows match score, reason, skills to highlight, gaps to address
- [ ] Selecting a JD changes the recommendations to be contextual

---

## Feature 10 — Agent 4: CV Generator (Human-in-Loop)

> **Done when:** You start a CV generation, review each section one at a time, edit if needed, approve, and download the final text file.

### How HIL works locally:

The agent pauses after generating each section.
State is saved in the database (no Redis needed for HIL locally).
Frontend polls the job status and shows the current section for review.
User edits + clicks "Approve" → backend continues to next section.

### Checkpoint Flow:
```
Start
  ↓ [Generate Professional Summary] ──→ status: AWAITING_REVIEW (section: summary)
  ↓ User reviews + edits + approves
  ↓ [Generate Experience Section]   ──→ AWAITING_REVIEW (section: experience)
  ↓ User reviews + edits + approves
  ↓ [Generate Skills Section]       ──→ AWAITING_REVIEW (section: skills)
  ↓ User reviews + edits + approves
  ↓ [Generate Cover Letter]         ──→ AWAITING_REVIEW (section: cover_letter)
  ↓ User reviews + edits + approves
  ↓ [Compile Final CV]              ──→ status: DONE
  ↓ Download as .txt file (locally)
```

**Model:** `ai_engine/models.py` — add `CVGeneration`
```python
# CVGeneration:
#   user, resume (FK), jd (FK, null),
#   current_checkpoint (text — which section is paused at),
#   approved_sections (JSONField — sections approved so far),
#   generated_content (text — current section's AI output),
#   final_content (text — assembled CV, null until DONE),
#   status (PENDING|AWAITING_REVIEW|PROCESSING|DONE|FAILED),
#   started_at, completed_at
```

**Key endpoints:**
```
POST /api/cv-generation/                      ← Start (triggers step 1)
GET  /api/cv-generation/:id/                  ← Poll status + get current content
POST /api/cv-generation/:id/approve/          ← {section, content} → trigger next step
POST /api/cv-generation/:id/regenerate/       ← Redo current section
GET  /api/cv-generation/:id/download/         ← Returns final_content as downloadable .txt
```

**Frontend `/cv-generator/:id`:**
```
Progress bar: [Summary] [Experience] [Skills] [Cover Letter] [Done]
                  ↑ current step highlighted

┌─────────────────────────────────────────────────────┐
│  AI Generated Summary:                               │
│  ┌───────────────────────────────────────────────┐  │
│  │ Experienced backend engineer with 4 years...  │  │
│  │ (editable textarea — user can modify)         │  │
│  └───────────────────────────────────────────────┘  │
│  [🔁 Regenerate]          [✅ Approve & Continue]   │
└─────────────────────────────────────────────────────┘

Approved sections (accordion — read only):
  ▶ Summary (approved ✅)
```

### ✅ Feature 10 Done When:
- [ ] Start CV generation, select resume + JD
- [ ] See "Generating summary..." spinner, then summary appears in editable textarea
- [ ] Edit the summary, click Approve → experience section generates
- [ ] Complete all 4 sections → "CV Ready" state
- [ ] Download button saves final_content as a .txt file

---

## Feature 11 — Agent 5: Resume Generator (Human-in-Loop)

Follow the same pattern as Feature 10.

**Differences from CV Generator:**
- Can start from scratch (no existing resume) — shows an info form first (name, email, phone, LinkedIn, GitHub, experience description)
- Section flow: Summary → Work Experience → Skills → Education & Projects → Compile
- Output is ATS-optimised resume (no tables, no columns, standard section headings)
- Final output: download as .txt file

**Checkpoint Flow:**
```
Start (with existing resume OR fresh form inputs)
  ↓ [Generate Summary]             → AWAITING_REVIEW
  ↓ [Generate Work Experience]     → AWAITING_REVIEW
  ↓ [Generate Skills]              → AWAITING_REVIEW
  ↓ [Generate Education/Projects]  → AWAITING_REVIEW
  ↓ [Compile ATS Resume]           → DONE
  ↓ Download .txt
```

### ✅ Feature 11 Done When:
- [ ] Start resume generator (with or without existing resume)
- [ ] Review and approve each section
- [ ] Final compiled resume shown and downloadable as .txt

---

## Feature 12 — Analytics Dashboard

> **Done when:** `/analytics` page shows charts for funnel, velocity, skill gaps, and source breakdown.

### Backend Endpoints

**`analytics/views.py`:**
```python
# GET /api/analytics/funnel/          — count of applications per status
# GET /api/analytics/velocity/        — applications per week (last 8 weeks)
# GET /api/analytics/skill-gaps/      — top missing skills + rejection correlation
# GET /api/analytics/response-rate/   — % that got past APPLIED
# GET /api/analytics/sources/         — LinkedIn vs Naukri vs Referral counts
# GET /api/analytics/score-distribution/ — histogram of resume scores (0-20, 21-40, etc.)
```

**Example — Skill Gaps:**
```python
from collections import Counter

class SkillGapsView(APIView):
    def get(self, request):
        from applications.models import JobApplication, ResumeScore
        scores = ResumeScore.objects.filter(
            application__user=request.user, status='DONE'
        )
        counter = Counter()
        for s in scores:
            gaps = s.user_edited_missing or s.missing_skills or []
            for skill in gaps:
                counter[skill.lower().strip()] += 1

        # Rejection correlation
        rejected_ids = JobApplication.objects.filter(
            user=request.user, status='REJECTED'
        ).values_list('id', flat=True)
        rejection_counter = Counter()
        for s in ResumeScore.objects.filter(application_id__in=rejected_ids, status='DONE'):
            for skill in (s.user_edited_missing or s.missing_skills or []):
                rejection_counter[skill.lower().strip()] += 1

        return Response({
            'top_gaps': [
                {
                    'skill': skill,
                    'frequency': count,
                    'rejection_correlation': rejection_counter.get(skill, 0),
                }
                for skill, count in counter.most_common(15)
            ]
        })
```

### Frontend Charts (Recharts)

```jsx
// Funnel — BarChart
// Velocity — LineChart (applications per week)
// Skill Gaps — horizontal BarChart (frequency + rejection bars)
// Sources — PieChart
```

### ✅ Feature 12 Done When:
- [ ] Funnel bar chart shows application counts by stage
- [ ] Velocity line chart shows weekly activity
- [ ] Skill gaps chart shows top missing skills
- [ ] Source pie chart shows where applications came from

---

## Phase 13 — [OPTIONAL] Cloud Deployment

> Only do this after every feature above is fully working on your local machine.
> This phase migrates your local app to AWS without changing any feature code.

### What changes when going to cloud:

| What | Local | Cloud |
|------|-------|-------|
| Database | SQLite (`db.sqlite3`) | AWS RDS PostgreSQL |
| File storage | `backend/media/` folder | AWS S3 bucket |
| Redis | Local Redis | AWS ElastiCache |
| Email | Console (terminal) | AWS SES or Gmail SMTP |
| ChromaDB | `backend/chroma_db/` folder | EFS mount on EC2 |
| Server | `python manage.py runserver` | Gunicorn behind Nginx |
| Celery | Local terminal | Celery on same EC2 |
| Frontend | `npm run dev` | Nginx static files |

### Step 13.1 — Install Cloud Packages

```bash
# Only installed when moving to cloud
pip install psycopg2-binary django-storages boto3
```

### Step 13.2 — Create `config/settings_production.py`

```python
# Inherits everything from settings.py and overrides cloud-specific values
from .settings import *
import os

DEBUG = False
ALLOWED_HOSTS = [os.getenv('DOMAIN'), os.getenv('EC2_IP')]

# PostgreSQL (RDS)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     os.getenv('DB_NAME'),
        'USER':     os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST':     os.getenv('DB_HOST'),
        'PORT':     '5432',
    }
}

# S3 for file storage
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID     = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')
AWS_S3_REGION_NAME    = os.getenv('AWS_REGION', 'ap-south-1')
AWS_DEFAULT_ACL       = 'private'

# ElastiCache Redis
CELERY_BROKER_URL    = os.getenv('REDIS_URL')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL')

# Real email (AWS SES or Gmail SMTP)
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = os.getenv('EMAIL_HOST', 'email-smtp.ap-south-1.amazonaws.com')
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL  = os.getenv('DEFAULT_FROM_EMAIL')

FRONTEND_URL = os.getenv('FRONTEND_URL')

# ChromaDB on EFS
CHROMA_DB_PATH = '/mnt/efs/chroma_db'

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Step 13.3 — Docker Compose (Cloud)

```yaml
version: '3.9'
services:
  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings_production
    env_file: .env.production
    volumes:
      - chroma_data:/mnt/efs/chroma_db

  celery_worker:
    build: ./backend
    command: celery -A config worker -l info -c 4
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings_production
    env_file: .env.production
    volumes:
      - chroma_data:/mnt/efs/chroma_db

  celery_beat:
    build: ./backend
    command: celery -A config beat -l info
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings_production
    env_file: .env.production

  frontend:
    build: ./frontend
    command: nginx -g 'daemon off;'
    ports:
      - "80:80"
      - "443:443"

volumes:
  chroma_data:
```

### Step 13.4 — Production `.env.production`

```env
SECRET_KEY=generate-a-strong-secret-key
DEBUG=False
DOMAIN=yourdomain.com
EC2_IP=your.ec2.ip.address
FRONTEND_URL=https://yourdomain.com

GOOGLE_API_KEY=your_gemini_key

# RDS
DB_NAME=jobtracker
DB_USER=postgres
DB_PASSWORD=strong-db-password
DB_HOST=your-rds-endpoint.rds.amazonaws.com

# ElastiCache
REDIS_URL=redis://your-elasticache-endpoint:6379/0

# S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=jobtracker-resumes-prod
AWS_REGION=ap-south-1

# Email (SES)
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_HOST_USER=your-ses-smtp-user
EMAIL_HOST_PASSWORD=your-ses-smtp-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Step 13.5 — AWS Services Checklist

- [ ] EC2 t3.small — spin up, SSH in, install Docker + Docker Compose
- [ ] RDS PostgreSQL 15 — create in same VPC as EC2
- [ ] ElastiCache Redis — create in same VPC
- [ ] S3 bucket — create, set private ACL
- [ ] SES — verify your domain, get SMTP credentials
- [ ] Route53 — point domain to EC2 Elastic IP
- [ ] Certbot — SSL certificate on EC2

### Step 13.6 — Deploy Commands

```bash
# On EC2
git clone your-repo
cd jobtracker
cp .env.production .env

docker-compose up -d --build
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --no-input
docker-compose exec backend python manage.py createsuperuser
```

---

## Complete File Structure Reference

```
jobtracker/
│
├── backend/
│   ├── config/
│   │   ├── __init__.py         (imports celery app)
│   │   ├── settings.py         (local — SQLite, console email, local files)
│   │   ├── settings_production.py  (cloud — added in Phase 13)
│   │   ├── celery.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── users/                  (Feature 1)
│   │   ├── models.py           User, EmailVerificationToken, PasswordResetToken, LoginHistory
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py            send_activation_email, send_welcome, send_login_alert, send_reset
│   │   └── urls.py
│   │
│   ├── resumes/                (Feature 3)
│   │   ├── models.py           Resume
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py            process_resume_task (extract text + embed)
│   │   └── urls.py
│   │
│   ├── job_descriptions/       (Feature 4)
│   │   ├── models.py           JobDescription, JDAnalysis
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── applications/           (Feature 5)
│   │   ├── models.py           JobApplication, ResumeScore, Tag, Reminder
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── ai_engine/              (Features 6–11)
│   │   ├── models.py           ResumeAnalysis, JobRecommendation, CVGeneration, ResumeGeneration
│   │   ├── tasks.py            All AI Celery tasks
│   │   └── agents/
│   │       ├── resume_analyzer.py   (Feature 6)
│   │       ├── jd_analyzer.py       (Feature 7)
│   │       ├── job_recommender.py   (Feature 9)
│   │       ├── cv_generator.py      (Feature 10)
│   │       └── resume_generator.py  (Feature 11)
│   │
│   ├── analytics/              (Feature 2 shell + Feature 12 full)
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── media/                  (gitignored — local uploaded files)
│   │   └── resumes/
│   ├── chroma_db/              (gitignored — local vector store)
│   ├── db.sqlite3              (gitignored — local database)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js       (axios + JWT interceptor)
│   │   │   ├── auth.js
│   │   │   ├── resumes.js
│   │   │   ├── jobDescriptions.js
│   │   │   ├── applications.js
│   │   │   ├── cvGeneration.js
│   │   │   ├── resumeGeneration.js
│   │   │   └── recommendations.js
│   │   │
│   │   ├── store/
│   │   │   └── authStore.js    (Zustand — user + isAuthenticated)
│   │   │
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── AppLayout.jsx
│   │   │   └── ai/
│   │   │       ├── TaskStatusBadge.jsx
│   │   │       ├── ScoreDisplay.jsx
│   │   │       ├── SkillEditor.jsx
│   │   │       └── HILReviewPanel.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── ActivatePage.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   └── ResetPasswordPage.jsx
│   │   │   ├── LandingPage.jsx             (Feature 2b — public showcase page)
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ResumesPage.jsx
│   │   │   ├── JobDescriptionsPage.jsx
│   │   │   ├── ApplicationsPage.jsx        (Kanban)
│   │   │   ├── JobRecommendationsPage.jsx
│   │   │   ├── CVGeneratorPage.jsx
│   │   │   ├── ResumeGeneratorPage.jsx
│   │   │   └── AnalyticsPage.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── .env                        (single config file — only GOOGLE_API_KEY needed locally)
```

---

## Quick Reference — How to Run Locally

```bash
# Terminal 1 — Django backend
cd backend
source venv/bin/activate
python manage.py runserver
# → http://localhost:8000

# Terminal 2 — Celery worker (AI tasks run here)
cd backend
source venv/bin/activate
celery -A config worker --loglevel=info

# Terminal 3 — React frontend
cd frontend
npm run dev
# → http://localhost:5173

# Terminal 4 — (optional) Celery Beat for reminder scheduler
cd backend
source venv/bin/activate
celery -A config beat --loglevel=info
```

**You only need 3 things to get started:**
1. A Gemini API key (free at aistudio.google.com)
2. Redis running locally (`brew install redis && brew services start redis`)
3. This plan — build one feature at a time ✅
