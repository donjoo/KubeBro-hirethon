import logging
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketCreateSerializer,
    TicketStatusUpdateSerializer, TicketCommentSerializer, TicketCommentCreateSerializer
)
from ..models import Ticket, TicketComment

logger = logging.getLogger(__name__)
User = get_user_model()


class IsOwnerOrAdmin(permissions.BasePermission):
    """Custom permission to only allow owners or admins to access tickets."""
    
    def has_permission(self, request, view):
        # Allow authenticated users to access the view
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access all tickets
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Users can only access their own tickets
        return obj.user == request.user


class TicketViewSet(ModelViewSet):
    """ViewSet for managing tickets."""
    
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return tickets based on user permissions."""
        user = self.request.user
        
        if user.is_staff or user.is_superuser:
            # Admins can see all tickets
            queryset = Ticket.objects.all()
        else:
            # Users can only see their own tickets
            queryset = Ticket.objects.filter(user=user)
        
        # Apply additional filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('user', 'assigned_to').prefetch_related('comments__author')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return TicketListSerializer
        elif self.action == 'create':
            return TicketCreateSerializer
        elif self.action in ['update_status', 'partial_update']:
            return TicketStatusUpdateSerializer
        else:
            return TicketDetailSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['list', 'retrieve', 'create']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
        
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create a new ticket."""
        logger.info(f"Ticket creation request from {request.user.email}")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            ticket = serializer.save()
            
            # Log ticket creation
            logger.info(f"Ticket created successfully: {ticket.id} - {ticket.title}")
            
            # Return full ticket details
            detail_serializer = TicketDetailSerializer(ticket, context={'request': request})
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        
        logger.warning(f"Ticket creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update ticket (admin only for status changes)."""
        ticket = self.get_object()
        
        # Check if user is admin for status updates
        if not (request.user.is_staff or request.user.is_superuser):
            # Regular users can only update their own tickets and only certain fields
            allowed_fields = ['title', 'description']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            if not data:
                return Response(
                    {'error': 'You can only update title and description'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            request.data.clear()
            request.data.update(data)
        
        logger.info(f"Ticket update request: {ticket.id} by {request.user.email}")
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_comment(self, request, pk=None):
        """Add a comment to a ticket."""
        ticket = self.get_object()
        
        # Check permissions
        if not (request.user.is_staff or request.user.is_superuser or ticket.user == request.user):
            return Response(
                {'error': 'You do not have permission to comment on this ticket'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TicketCommentCreateSerializer(
            data=request.data, 
            context={'request': request, 'ticket': ticket}
        )
        
        if serializer.is_valid():
            comment = serializer.save()
            
            logger.info(f"Comment added to ticket {ticket.id} by {request.user.email}")
            
            # Return the comment with full details
            comment_serializer = TicketCommentSerializer(comment, context={'request': request})
            return Response(comment_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update ticket status (admin only)."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can update ticket status'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket = self.get_object()
        serializer = TicketStatusUpdateSerializer(ticket, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_ticket = serializer.save()
            
            logger.info(f"Ticket status updated: {ticket.id} to {updated_ticket.status} by {request.user.email}")
            
            # Return full ticket details
            detail_serializer = TicketDetailSerializer(updated_ticket, context={'request': request})
            return Response(detail_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_tickets(self, request):
        """Get current user's tickets."""
        queryset = self.get_queryset().filter(user=request.user)
        
        # Apply filters
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TicketListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = TicketListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def assigned_to_me(self, request):
        """Get tickets assigned to current admin user."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can access assigned tickets'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset().filter(assigned_to=request.user)
        
        # Apply filters
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TicketListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = TicketListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Get ticket statistics."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can access ticket statistics'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'open': queryset.filter(status='open').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'pending_user': queryset.filter(status='pending_user').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'closed': queryset.filter(status='closed').count(),
            'by_priority': {
                'low': queryset.filter(priority='low').count(),
                'medium': queryset.filter(priority='medium').count(),
                'high': queryset.filter(priority='high').count(),
                'urgent': queryset.filter(priority='urgent').count(),
            },
            'by_category': {
                'bug': queryset.filter(category='bug').count(),
                'feature': queryset.filter(category='feature').count(),
                'support': queryset.filter(category='support').count(),
                'billing': queryset.filter(category='billing').count(),
                'other': queryset.filter(category='other').count(),
            }
        }
        
        return Response(stats)


class TicketCommentViewSet(ModelViewSet):
    """ViewSet for managing ticket comments."""
    
    serializer_class = TicketCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return comments based on user permissions."""
        ticket_id = self.kwargs.get('ticket_pk')
        user = self.request.user
        
        queryset = TicketComment.objects.filter(ticket_id=ticket_id)
        
        # Non-admin users can only see non-internal comments
        if not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(is_internal=False)
        
        return queryset.select_related('author', 'ticket').order_by('created_at')
    
    def create(self, request, *args, **kwargs):
        """Create a new comment."""
        ticket_id = kwargs.get('ticket_pk')
        
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not (request.user.is_staff or request.user.is_superuser or ticket.user == request.user):
            return Response(
                {'error': 'You do not have permission to comment on this ticket'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TicketCommentCreateSerializer(
            data=request.data, 
            context={'request': request, 'ticket': ticket}
        )
        
        if serializer.is_valid():
            comment = serializer.save()
            
            logger.info(f"Comment created on ticket {ticket.id} by {request.user.email}")
            
            return_serializer = TicketCommentSerializer(comment, context={'request': request})
            return Response(return_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
