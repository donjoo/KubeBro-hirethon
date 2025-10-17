from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import Ticket, TicketComment


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'user', 'category', 'priority', 'status', 
        'assigned_to', 'created_at', 'is_open'
    ]
    list_filter = ['status', 'priority', 'category', 'created_at', 'assigned_to']
    search_fields = ['title', 'description', 'user__email', 'user__name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'resolved_at']
    raw_id_fields = ['user', 'assigned_to']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'description', 'category', 'priority')
        }),
        ('Status & Assignment', {
            'fields': ('status', 'assigned_to', 'admin_feedback')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_open(self, obj):
        """Display if ticket is open."""
        if obj.is_open:
            return format_html('<span style="color: green;">✓ Open</span>')
        else:
            return format_html('<span style="color: red;">✗ Closed</span>')
    is_open.short_description = 'Status'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user', 'assigned_to')
    
    def save_model(self, request, obj, form, change):
        """Log admin changes."""
        if change:
            # Log status changes
            if 'status' in form.changed_data:
                from django.contrib.admin.models import LogEntry, CHANGE
                LogEntry.objects.log_action(
                    user_id=request.user.id,
                    content_type_id=None,  # We'll handle this differently
                    object_id=obj.id,
                    object_repr=str(obj),
                    action_flag=CHANGE,
                    change_message=f"Status changed to {obj.status}"
                )
        super().save_model(request, obj, form, change)


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'ticket_link', 'author', 'is_internal', 'is_admin_comment', 
        'created_at', 'content_preview'
    ]
    list_filter = ['is_internal', 'created_at', 'author__is_staff']
    search_fields = ['content', 'author__email', 'ticket__title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['ticket', 'author']
    
    def ticket_link(self, obj):
        """Link to ticket."""
        url = reverse('admin:tickets_ticket_change', args=[obj.ticket.id])
        return format_html('<a href="{}">#{}</a>', url, obj.ticket.id)
    ticket_link.short_description = 'Ticket'
    
    def content_preview(self, obj):
        """Show content preview."""
        if len(obj.content) > 50:
            return obj.content[:50] + '...'
        return obj.content
    content_preview.short_description = 'Content Preview'
    
    def is_admin_comment(self, obj):
        """Display if comment is from admin."""
        if obj.is_admin_comment:
            return format_html('<span style="color: blue;">Admin</span>')
        else:
            return format_html('<span style="color: green;">User</span>')
    is_admin_comment.short_description = 'Type'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('ticket', 'author')


# Customize admin site
admin.site.site_header = "KubeBro Hirethon Admin"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Welcome to KubeBro Hirethon Administration"
