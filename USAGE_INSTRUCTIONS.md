# How to Use the Ticket Management System

## 🚀 Getting Started

The ticket management system is now fully functional! Here's how to use it:

### 1. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

### 2. First Time Setup

#### Option A: Register a New User
1. Go to http://localhost:5173
2. Click "Login / Sign Up" button
3. Click "Sign Up" tab
4. Fill in the form:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Choose a strong password (min 8 characters)
   - **Confirm Password**: Re-enter your password
5. Click "Sign Up"
6. You'll be automatically logged in and redirected to the dashboard

#### Option B: Use the Admin Account
- **Email**: admin@example.com
- **Password**: admin123

### 3. Using the Ticket System

#### For Regular Users:
1. **Login** to the application
2. **Navigate to Support Tickets** using the navigation menu
3. **Create a New Ticket**:
   - Click "Create New Ticket" button
   - Fill in the form:
     - **Title**: Brief description of your issue
     - **Description**: Detailed explanation
     - **Category**: Choose from Bug, Feature, Support, Billing, or Other
     - **Priority**: Low, Medium, High, or Urgent
   - Click "Create Ticket"
4. **View Your Tickets**:
   - See all your tickets in the list
   - Click on any ticket to view details
   - Add comments to provide additional information
5. **Track Progress**:
   - Monitor ticket status (Open → In Progress → Pending User → Resolved → Closed)
   - Read admin feedback and responses

#### For Admins:
1. **Login** with admin credentials
2. **Access All Tickets**:
   - View tickets from all users
   - Use "Assigned to Me" tab to see your assigned tickets
3. **Manage Tickets**:
   - Update ticket status
   - Assign tickets to team members
   - Add admin feedback
   - Add internal or public comments
4. **Admin Panel**:
   - Access http://localhost:8000/admin/ for advanced management
   - View detailed ticket information
   - Manage users and permissions

### 4. Features Available

#### ✅ User Features:
- Create support tickets
- View ticket status and progress
- Add comments to tickets
- Track ticket history
- Receive admin feedback

#### ✅ Admin Features:
- View all tickets from all users
- Update ticket status and priority
- Assign tickets to team members
- Add admin feedback and resolution notes
- Add internal comments (admin-only)
- View ticket statistics and analytics
- Manage users and permissions

### 5. Troubleshooting

#### If you see "Error loading tickets":
1. **Make sure you're logged in** - You need to be authenticated to access tickets
2. **Check your internet connection** - The frontend needs to communicate with the backend
3. **Try refreshing the page** - Sometimes the authentication state needs to be refreshed

#### If you can't see the "Create Ticket" button:
1. **Ensure you're logged in** - The button only appears for authenticated users
2. **Check the navigation** - Make sure you're on the "Support Tickets" page
3. **Verify permissions** - Regular users should see the create button

#### If you get 403 Forbidden errors:
1. **Login again** - Your session might have expired
2. **Check your credentials** - Make sure you're using the correct email/password
3. **Clear browser cache** - Sometimes cached data can cause issues

### 6. API Testing

You can also test the system directly via API:

#### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

#### Create Ticket:
```bash
curl -X POST http://localhost:8000/api/tickets/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Ticket", "description": "Test description", "category": "support", "priority": "medium"}'
```

#### View Tickets:
```bash
curl -X GET http://localhost:8000/api/tickets/my_tickets/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. System Status

The system is fully functional with:
- ✅ User authentication and registration
- ✅ Ticket creation and management
- ✅ Comment system
- ✅ Admin controls
- ✅ Status tracking
- ✅ Priority and category management
- ✅ Responsive design
- ✅ Error handling
- ✅ Logging and monitoring

### 8. Next Steps

1. **Register/Login** to the application
2. **Create your first ticket** to test the system
3. **Explore the admin features** if you have admin access
4. **Add comments** to tickets for communication
5. **Update ticket status** as an admin

The system is ready for production use! 🎉
