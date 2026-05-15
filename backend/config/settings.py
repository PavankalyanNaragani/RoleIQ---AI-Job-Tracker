from pathlib import Path
from tempfile import gettempdir
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Some environments inject a dead local proxy (127.0.0.1:9), which breaks
# outbound AI API calls (Gemini) with WinError 10061. Clear only that value.
for _proxy_key in ('HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy'):
    if os.environ.get(_proxy_key, '').strip().lower() == 'http://127.0.0.1:9':
        os.environ.pop(_proxy_key, None)

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
# SQLite — use OS user temp directory (reliable writable path on this machine)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(Path(gettempdir()) / 'jobtracker_db.sqlite3'),
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
