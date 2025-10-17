import logging
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


class Ticket(models.Model):
    """Ticket model for support requests."""
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('pending_user', 'Pending User'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    CATEGORY_CHOICES = [
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('support', 'Technical Support'),
        ('billing', 'Billing Issue'),
        ('other', 'Other'),
    ]
    
    # Basic ticket information
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='support')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_tickets',
        help_text="Admin user assigned to handle this ticket"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Admin feedback
    admin_feedback = models.TextField(blank=True, help_text="Admin feedback or resolution notes")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['assigned_to', 'status']),
        ]
    
    def __str__(self):
        return f"#{self.id} - {self.title}"
    
    def save(self, *args, **kwargs):
        # Log ticket creation/updates
        if self.pk:
            logger.info(f"Ticket updated: {self.id} - Status: {self.status}")
        else:
            logger.info(f"New ticket created: {self.title} by {self.user.email}")
        
        # Set resolved_at when status changes to resolved
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
            logger.info(f"Ticket resolved: {self.id}")
        
        super().save(*args, **kwargs)
    
    @property
    def is_open(self):
        return self.status in ['open', 'in_progress', 'pending_user']
    
    @property
    def is_resolved(self):
        return self.status in ['resolved', 'closed']


class TicketComment(models.Model):
    """Comments on tickets by users and admins."""
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ticket_comments')
    content = models.TextField()
    is_internal = models.BooleanField(
        default=False, 
        help_text="Internal comments visible only to admins"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket', 'created_at']),
            models.Index(fields=['author', 'created_at']),
        ]
    
    def __str__(self):
        return f"Comment on #{self.ticket.id} by {self.author.email}"
    
    def save(self, *args, **kwargs):
        # Log comment creation
        if not self.pk:
            logger.info(f"Comment added to ticket {self.ticket.id} by {self.author.email}")
        
        super().save(*args, **kwargs)
    
    @property
    def is_admin_comment(self):
        return self.author.is_staff or self.author.is_superuser
