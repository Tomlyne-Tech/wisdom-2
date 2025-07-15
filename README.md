# Wisdom Chamber Admin System

This is a comprehensive admin system for the Wisdom Chamber website that allows administrators to manage website activities and handle email communications.

## Features

### Admin Login
- Secure JWT-based authentication
- Session management
- Password-protected access

### Dashboard
- Overview of website statistics
- Email management metrics
- Recent activity tracking
- Real-time data updates

### Email Management
- View all contact form submissions
- Mark emails as read/unread
- Reply to emails directly from the dashboard
- Email status tracking (unread, read, replied)

### Activity Tracking
- Login/logout tracking
- Contact form submissions
- Email replies
- IP address and user agent logging

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure email settings (optional):
   - Set `EMAIL_USER` environment variable to your email address
   - Set `EMAIL_PASS` environment variable to your email password/app password
   - Update the email service in `server.js` if not using Gmail

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Usage

### Access Admin Panel
1. Navigate to `http://localhost:3000/admin`
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

### Dashboard Features
- **Dashboard Tab**: Overview of statistics and recent activities
- **Emails Tab**: Manage all contact form submissions
- **Activities Tab**: View all website activities

### Email Management
1. Click on "Emails" tab to view all contact form submissions
2. Unread emails are highlighted in yellow
3. Click "Reply" to respond to any email
4. Use "Mark as Read" to change email status

### Contact Form Integration
The contact form on your website automatically integrates with the admin system:
- All submissions are stored in the database
- Admins receive notifications of new messages
- Activities are logged for tracking

## File Structure

```
├── admin/
│   ├── login.html          # Admin login page
│   ├── dashboard.html      # Admin dashboard
│   ├── admin.css          # Admin panel styles
│   └── admin.js           # Admin functionality
├── server.js              # Main server file
├── package.json           # Dependencies
├── contact.html           # Updated contact form
├── style.css              # Website styles (updated)
└── admin.db               # SQLite database (auto-created)
```

## Database Schema

The system uses SQLite with the following tables:

### admins
- `id` (Primary Key)
- `username` (Unique)
- `password` (Hashed)
- `email`
- `created_at`

### emails
- `id` (Primary Key)
- `name`
- `email`
- `subject`
- `message`
- `status` (unread/read/replied)
- `replied_at`
- `reply_message`
- `created_at`

### activities
- `id` (Primary Key)
- `activity_type`
- `description`
- `ip_address`
- `user_agent`
- `created_at`

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/emails` - Get all emails
- `PUT /api/admin/emails/:id/read` - Mark email as read
- `POST /api/admin/emails/:id/reply` - Reply to email

### Public
- `POST /api/contact` - Submit contact form
- `GET /admin` - Admin login page
- `GET /admin/dashboard` - Admin dashboard

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Session management
- Input validation
- SQL injection prevention
- XSS protection

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - JWT secret key
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password

### Email Configuration
Update the email transporter in `server.js`:
```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Default Admin Account

**Username:** admin  
**Password:** admin123

⚠️ **Important:** Change the default password after first login for security.

## Troubleshooting

### Common Issues

1. **Email sending fails:**
   - Check EMAIL_USER and EMAIL_PASS environment variables
   - Verify email service configuration
   - Enable 2FA and use app passwords for Gmail

2. **Database errors:**
   - Ensure write permissions in the project directory
   - Check if admin.db file is created

3. **Authentication issues:**
   - Clear browser local storage
   - Check JWT_SECRET configuration

### Development Tips

- Use `npm run dev` for development with auto-restart
- Check browser console for JavaScript errors
- Monitor server logs for backend errors
- Use browser dev tools to debug API calls

## License

This project is part of the Wisdom Chamber website and is intended for educational purposes.