const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session configuration
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize SQLite database
const db = new sqlite3.Database('./admin.db');

// Create tables
db.serialize(() => {
  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Website activities table
  db.run(`CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Emails table
  db.run(`CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    replied_at DATETIME,
    reply_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create default admin user (username: admin, password: admin123)
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password, email) VALUES (?, ?, ?)`, 
    ['admin', defaultPassword, 'admin@wisdomchamber.com']);
});

// Email configuration (configure with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
  const token = req.session.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Log activity function
const logActivity = (type, description, req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  db.run(`INSERT INTO activities (activity_type, description, ip_address, user_agent) 
          VALUES (?, ?, ?, ?)`, [type, description, ip, userAgent]);
};

// Routes

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      logActivity('LOGIN_FAILED', `Failed login attempt for username: ${username}`, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    req.session.token = token;

    logActivity('LOGIN_SUCCESS', `Admin ${username} logged in successfully`, req);
    res.json({ token, admin: { id: admin.id, username: admin.username, email: admin.email } });
  });
});

// Admin logout
app.post('/api/admin/logout', verifyToken, (req, res) => {
  logActivity('LOGOUT', `Admin ${req.admin.username} logged out`, req);
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// Get dashboard data
app.get('/api/admin/dashboard', verifyToken, (req, res) => {
  // Get recent activities
  db.all('SELECT * FROM activities ORDER BY created_at DESC LIMIT 50', (err, activities) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get email statistics
    db.all(`SELECT 
              COUNT(*) as total_emails,
              SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_emails,
              SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_emails
            FROM emails`, (err, emailStats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        activities,
        emailStats: emailStats[0] || { total_emails: 0, unread_emails: 0, replied_emails: 0 }
      });
    });
  });
});

// Get all emails
app.get('/api/admin/emails', verifyToken, (req, res) => {
  db.all('SELECT * FROM emails ORDER BY created_at DESC', (err, emails) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(emails);
  });
});

// Reply to email
app.post('/api/admin/emails/:id/reply', verifyToken, (req, res) => {
  const { id } = req.params;
  const { reply_message } = req.body;

  db.get('SELECT * FROM emails WHERE id = ?', [id], (err, email) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Send reply email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'admin@wisdomchamber.com',
      to: email.email,
      subject: `Re: ${email.subject || 'Contact Form Message'}`,
      html: `
        <h3>Thank you for contacting Wisdom Chamber</h3>
        <p>Hello ${email.name},</p>
        <p>${reply_message}</p>
        <hr>
        <p><strong>Your original message:</strong></p>
        <p>${email.message}</p>
        <br>
        <p>Best regards,<br>Wisdom Chamber Team</p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      }

      // Update email status
      db.run(`UPDATE emails SET status = 'replied', replied_at = CURRENT_TIMESTAMP, reply_message = ? WHERE id = ?`, 
        [reply_message, id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        logActivity('EMAIL_REPLY', `Admin replied to email from ${email.name} (${email.email})`, req);
        res.json({ message: 'Reply sent successfully' });
      });
    });
  });
});

// Handle contact form submissions
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  db.run(`INSERT INTO emails (name, email, subject, message) VALUES (?, ?, ?, ?)`, 
    [name, email, subject || 'Contact Form Message', message], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    logActivity('CONTACT_FORM', `New contact form submission from ${name} (${email})`, req);
    res.json({ message: 'Message sent successfully' });
  });
});

// Mark email as read
app.put('/api/admin/emails/:id/read', verifyToken, (req, res) => {
  const { id } = req.params;

  db.run(`UPDATE emails SET status = 'read' WHERE id = ?`, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Email marked as read' });
  });
});

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/admin`);
  console.log(`Default admin credentials: username: admin, password: admin123`);
});