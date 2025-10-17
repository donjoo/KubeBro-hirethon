import logging
from rest_framework import serializers
from django.contrib.auth import get_user_model

from hirethon_template.tickets.models import Ticket, TicketComment

logger = logging.getLogger(__name__)
User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for ticket display."""
    class Meta:
        model = User
        fields = ['id', 'email', 'name']


class TicketCommentSerializer(serializers.ModelSerializer):
    """Serializer for ticket comments."""
    author = UserBasicSerializer(read_only=True)
    author_id = serializers.IntegerField(write_only=True, required=False)
    is_admin_comment = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = TicketComment
        fields = [
            'id', 'content', 'author', 'author_id', 'is_internal', 
            'is_admin_comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set author to current user if not provided
        if 'author_id' not in validated_data:
            validated_data['author'] = self.context['request'].user
        else:
            validated_data['author'] = User.objects.get(id=validated_data.pop('author_id'))
        
        logger.info(f"Comment created on ticket {validated_data['ticket'].id} by {validated_data['author'].email}")
        return super().create(validated_data)


class TicketListSerializer(serializers.ModelSerializer):
    """Serializer for ticket list view (minimal data)."""
    user = UserBasicSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    latest_comment = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'category', 'priority', 'status', 'user', 
            'assigned_to', 'created_at', 'updated_at', 'resolved_at',
            'comment_count', 'latest_comment'
        ]
    
    def get_comment_count(self, obj):
        return obj.comments.filter(is_internal=False).count()
    
    def get_latest_comment(self, obj):
        latest = obj.comments.filter(is_internal=False).order_by('-created_at').first()
        if latest:
            return {
                'content': latest.content[:100] + '...' if len(latest.content) > 100 else latest.content,
                'author': latest.author.name or latest.author.email,
                'created_at': latest.created_at
            }
        return None


class TicketDetailSerializer(serializers.ModelSerializer):
    """Serializer for ticket detail view (full data)."""
    user = UserBasicSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    comments = TicketCommentSerializer(many=True, read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    is_resolved = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'category', 'priority', 'status',
            'user', 'assigned_to', 'assigned_to_id', 'admin_feedback',
            'created_at', 'updated_at', 'resolved_at', 'comments',
            'is_open', 'is_resolved'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'resolved_at']
    
    def create(self, validated_data):
        # Set user to current user
        validated_data['user'] = self.context['request'].user
        
        # Handle assigned_to if provided
        if 'assigned_to_id' in validated_data:
            assigned_to_id = validated_data.pop('assigned_to_id')
            if assigned_to_id:
                validated_data['assigned_to'] = User.objects.get(id=assigned_to_id)
        
        logger.info(f"Ticket created: {validated_data['title']} by {validated_data['user'].email}")
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle assigned_to if provided
        if 'assigned_to_id' in validated_data:
            assigned_to_id = validated_data.pop('assigned_to_id')
            if assigned_to_id:
                validated_data['assigned_to'] = User.objects.get(id=assigned_to_id)
            else:
                validated_data['assigned_to'] = None
        
        logger.info(f"Ticket updated: {instance.id} - Status: {validated_data.get('status', instance.status)}")
        return super().update(instance, validated_data)


class TicketCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new tickets."""
    
    class Meta:
        model = Ticket
        fields = ['title', 'description', 'category', 'priority']
    
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required.")
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long.")
        return value.strip()
    
    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description is required.")
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        return value.strip()
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        logger.info(f"New ticket created: {validated_data['title']} by {validated_data['user'].email}")
        return super().create(validated_data)


class TicketStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin status updates."""
    
    class Meta:
        model = Ticket
        fields = ['status', 'admin_feedback', 'assigned_to']
    
    def validate_status(self, value):
        if value not in [choice[0] for choice in Ticket.STATUS_CHOICES]:
            raise serializers.ValidationError("Invalid status.")
        return value
    
    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        logger.info(f"Ticket status updated: {instance.id} from {old_status} to {new_status}")
        return super().update(instance, validated_data)


class TicketCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ticket comments."""
    
    class Meta:
        model = TicketComment
        fields = ['content', 'is_internal']
    
    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Comment content is required.")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Comment must be at least 3 characters long.")
        return value.strip()
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['ticket'] = self.context['ticket']
        
        logger.info(f"Comment added to ticket {validated_data['ticket'].id} by {validated_data['author'].email}")
        return super().create(validated_data)
