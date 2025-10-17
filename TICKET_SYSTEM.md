# Ticket Management System

## Overview

A complete ticket management system where users can create support tickets, admins can manage them, and both can add comments and feedback.

## Features

### User Features
- **Create Tickets**: Users can create support tickets with title, description, category, and priority
- **View Tickets**: Users can view all their tickets with status and priority indicators
- **Add Comments**: Users can add comments to their tickets for additional information
- **Track Status**: Users can see the current status of their tickets (Open, In Progress, Pending User, Resolved, Closed)

### Admin Features
- **Manage Tickets**: Admins can view all tickets from all users
- **Update Status**: Admins can update ticket status and add admin feedback
- **Assign Tickets**: Admins can assign tickets to specific admin users
- **Add Comments**: Admins can add internal or public comments
- **View Statistics**: Admins can view ticket statistics and analytics

## Backend Implementation

### Models

#### Ticket Model
- **Fields**: title, description, category, priority, status, user, assigned_to, created_at, updated_at, resolved_at, admin_feedback
- **Status Options**: open, in_progress, pending_user, resolved, closed
- **Priority Options**: low, medium, high, urgent
- **Category Options**: bug, feature, support, billing, other

#### TicketComment Model
- **Fields**: ticket, author, content, is_internal, created_at, updated_at
- **Features**: Internal comments (admin-only) and public comments

### API Endpoints

#### Ticket Endpoints
- `GET /api/tickets/` - List all tickets (filtered by user permissions)
- `POST /api/tickets/` - Create new ticket
- `GET /api/tickets/{id}/` - Get ticket details
- `PATCH /api/tickets/{id}/` - Update ticket
- `PATCH /api/tickets/{id}/update_status/` - Update ticket status (admin only)
- `POST /api/tickets/{id}/add_comment/` - Add comment to ticket
- `GET /api/tickets/my_tickets/` - Get current user's tickets
- `GET /api/tickets/assigned_to_me/` - Get tickets assigned to current admin
- `GET /api/tickets/stats/` - Get ticket statistics (admin only)

#### Comment Endpoints
- `GET /api/tickets/{ticket_id}/comments/` - List ticket comments
- `POST /api/tickets/{ticket_id}/comments/` - Create new comment

### Permissions
- **Users**: Can only access their own tickets
- **Admins**: Can access all tickets and manage them
- **Comments**: Users can see non-internal comments, admins can see all comments

## Frontend Implementation

### Components

#### TicketManager
- Main container component that manages ticket state and routing

#### TicketList
- Displays list of tickets with filtering and sorting options
- Shows ticket status, priority, and latest comment preview
- Tab navigation for "My Tickets" and "Assigned to Me" (admin only)

#### CreateTicketForm
- Form for creating new tickets with validation
- Fields: title, description, category, priority

#### TicketDetail
- Detailed view of a single ticket
- Shows ticket information, admin feedback, and comments
- Allows adding new comments
- Admin controls for status updates

### Context Management
- **TicketContext**: Manages ticket state, API calls, and error handling
- **AuthContext**: Handles authentication and user permissions

### Styling
- Responsive design with mobile support
- Color-coded status and priority badges
- Clean, modern interface with proper spacing and typography

## Admin Interface

### Django Admin
- Custom admin interface for ticket management
- List view with filtering and search capabilities
- Detailed forms for ticket editing
- Comment management with admin/user distinction

### Admin Features
- **Ticket Management**: View, edit, and manage all tickets
- **User Assignment**: Assign tickets to specific admin users
- **Status Updates**: Change ticket status with automatic timestamping
- **Comment Management**: View and manage all comments
- **Statistics**: Access to ticket analytics and reporting

## Security Features

### Authentication
- JWT-based authentication for API access
- Token refresh mechanism
- Secure logout with token blacklisting

### Authorization
- Role-based access control (users vs admins)
- Object-level permissions (users can only access their tickets)
- Admin-only endpoints for sensitive operations

### Data Validation
- Server-side validation for all ticket and comment data
- Input sanitization and length limits
- Email uniqueness validation for user registration

## Logging

### Backend Logging
- Comprehensive logging for ticket operations
- Separate log files for authentication and general operations
- JSON-formatted logs for easy parsing and analysis

### Frontend Logging
- Console logging for debugging and monitoring
- Error tracking and user action logging
- Integration with browser developer tools

## Usage Instructions

### For Users
1. **Register/Login**: Create an account or login to access the system
2. **Create Ticket**: Click "Create New Ticket" and fill in the details
3. **View Tickets**: Navigate to "Support Tickets" to see all your tickets
4. **Add Comments**: Click on a ticket to view details and add comments
5. **Track Progress**: Monitor ticket status and admin feedback

### For Admins
1. **Login**: Use admin credentials to access the system
2. **View All Tickets**: Access all tickets from all users
3. **Manage Tickets**: Update status, assign to team members, add feedback
4. **Admin Interface**: Use Django admin for advanced ticket management
5. **Statistics**: View ticket analytics and reporting

## API Documentation

### Authentication
All API endpoints require authentication via JWT tokens:
```
Authorization: Bearer <access_token>
```

### Example API Calls

#### Create Ticket
```bash
POST /api/tickets/
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Login Issue",
  "description": "Unable to login with correct credentials",
  "category": "bug",
  "priority": "high"
}
```

#### Update Ticket Status (Admin)
```bash
PATCH /api/tickets/1/update_status/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "status": "in_progress",
  "admin_feedback": "Investigating the issue"
}
```

#### Add Comment
```bash
POST /api/tickets/1/add_comment/
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Additional information about the issue",
  "is_internal": false
}
```

## Testing

### Backend Testing
- Unit tests for models, serializers, and views
- Integration tests for API endpoints
- Permission testing for user/admin access

### Frontend Testing
- Component testing for React components
- Integration testing for user workflows
- API integration testing

## Deployment

### Docker Setup
The system runs in Docker containers:
- **Django Backend**: API server with database
- **React Frontend**: User interface
- **PostgreSQL**: Database
- **Redis**: Caching and session storage
- **Celery**: Background task processing

### Environment Variables
Configure the following environment variables:
- `DJANGO_SECRET_KEY`: Django secret key
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `DEBUG`: Debug mode (True/False)

## Future Enhancements

### Planned Features
- **Email Notifications**: Automatic email notifications for status changes
- **File Attachments**: Support for file uploads in tickets
- **Ticket Templates**: Pre-defined templates for common issues
- **Advanced Filtering**: More sophisticated filtering and search options
- **Mobile App**: Native mobile application
- **Integration**: Integration with external tools (Slack, Jira, etc.)

### Performance Optimizations
- **Caching**: Redis caching for frequently accessed data
- **Pagination**: Efficient pagination for large ticket lists
- **Database Optimization**: Query optimization and indexing
- **CDN**: Content delivery network for static assets

## Support

For technical support or questions about the ticket system:
- **Email**: support@example.com
- **Documentation**: Check this file and inline code comments
- **Issues**: Report bugs or feature requests through the ticket system itself

## License

This ticket management system is part of the KubeBro Hirethon project.
