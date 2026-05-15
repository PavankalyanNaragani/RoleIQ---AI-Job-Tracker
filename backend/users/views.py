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