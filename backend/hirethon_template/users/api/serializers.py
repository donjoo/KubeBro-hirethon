import logging
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from hirethon_template.users.models import User as UserType

logger = logging.getLogger(__name__)
User = get_user_model()


class UserSerializer(serializers.ModelSerializer[UserType]):
    class Meta:
        model = User
        fields = ["id", "email", "name", "date_joined", "is_active"]
        read_only_fields = ["id", "date_joined", "is_active"]

        extra_kwargs = {
            "url": {"view_name": "api:user-detail", "lookup_field": "pk"},
        }


class UserRegistrationSerializer(serializers.ModelSerializer[UserType]):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ["email", "name", "password", "password_confirm"]
        
    def validate_email(self, value):
        """Validate email uniqueness and format."""
        if User.objects.filter(email=value).exists():
            logger.warning(f"Registration attempt with existing email: {value}")
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_name(self, value):
        """Validate name field."""
        if not value or not value.strip():
            raise serializers.ValidationError("Name is required.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()
    
    def validate_password(self, value):
        """Validate password using Django's password validators."""
        try:
            validate_password(value)
        except ValidationError as e:
            logger.warning(f"Password validation failed: {e.messages}")
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            logger.warning("Password confirmation mismatch during registration")
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create new user with hashed password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=password
        )
        
        logger.info(f"New user registered successfully: {user.email}")
        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """Custom login serializer with email instead of username."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('username', None)
    
    def validate(self, attrs):
        """Validate login credentials."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            logger.warning("Login attempt with missing credentials")
            raise serializers.ValidationError("Email and password are required.")
        
        try:
            user = User.objects.get(email=email.lower())
            if not user.check_password(password):
                logger.warning(f"Invalid password for user: {email}")
                raise serializers.ValidationError("Invalid email or password.")
            if not user.is_active:
                logger.warning(f"Login attempt for inactive user: {email}")
                raise serializers.ValidationError("Account is inactive.")
        except User.DoesNotExist:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise serializers.ValidationError("Invalid email or password.")
        
        # Generate JWT tokens
        refresh = self.get_token(user)
        attrs['refresh'] = str(refresh)
        attrs['access'] = str(refresh.access_token)
        attrs['user'] = user
        
        logger.info(f"User logged in successfully: {email}")
        return attrs
