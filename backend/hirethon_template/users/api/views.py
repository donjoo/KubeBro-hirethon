import logging
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, UserRegistrationSerializer, UserLoginSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def get_queryset(self, *args, **kwargs):
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(id=self.request.user.id)

    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration endpoint."""
    logger.info(f"Registration attempt from IP: {request.META.get('REMOTE_ADDR')}")
    
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }
        
        logger.info(f"User registration successful: {user.email}")
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    logger.warning(f"Registration failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint."""
    logger.info(f"Login attempt from IP: {request.META.get('REMOTE_ADDR')}")
    
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        response_data = {
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': serializer.validated_data['refresh'],
                'access': serializer.validated_data['access'],
            },
            'message': 'Login successful'
        }
        
        logger.info(f"User login successful: {user.email}")
        return Response(response_data, status=status.HTTP_200_OK)
    
    logger.warning(f"Login failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout endpoint."""
    logger.info(f"Logout request from user: {request.user.email}")
    
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User logged out successfully: {request.user.email}")
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Logout attempt without refresh token from user: {request.user.email}")
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Logout error for user {request.user.email}: {str(e)}")
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
