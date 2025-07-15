// Admin Dashboard JavaScript
let currentEmail = null;
let dashboardData = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin';
        return;
    }
    
    // Set admin name
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    document.getElementById('adminName').textContent = adminUser.username || 'Admin';
}

// Initialize dashboard
function initializeDashboard() {
    setupTabNavigation();
    loadDashboardData();
    loadEmails();
}

// Setup tab navigation
function setupTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all menu items and tab contents
            menuItems.forEach(mi => mi.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Add active class to clicked menu item and corresponding tab
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load data based on tab
            if (targetTab === 'emails') {
                loadEmails();
            } else if (targetTab === 'activities') {
                loadActivities();
            }
        });
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        dashboardData = await response.json();
        updateDashboardStats();
        updateRecentActivities();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    if (!dashboardData) return;
    
    const stats = dashboardData.emailStats;
    document.getElementById('totalEmails').textContent = stats.total_emails || 0;
    document.getElementById('unreadEmails').textContent = stats.unread_emails || 0;
    document.getElementById('repliedEmails').textContent = stats.replied_emails || 0;
    document.getElementById('totalActivities').textContent = dashboardData.activities.length || 0;
    
    // Update unread badge
    const unreadBadge = document.getElementById('unreadBadge');
    if (stats.unread_emails > 0) {
        unreadBadge.textContent = stats.unread_emails;
        unreadBadge.style.display = 'inline-block';
    } else {
        unreadBadge.style.display = 'none';
    }
}

// Update recent activities
function updateRecentActivities() {
    if (!dashboardData) return;
    
    const activitiesList = document.getElementById('recentActivitiesList');
    
    if (dashboardData.activities.length === 0) {
        activitiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No Activities Yet</h3>
                <p>Website activities will appear here</p>
            </div>
        `;
        return;
    }
    
    activitiesList.innerHTML = dashboardData.activities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${getActivityIconClass(activity.activity_type)}">
                <i class="fas ${getActivityIcon(activity.activity_type)}"></i>
            </div>
            <div class="activity-info">
                <h4>${activity.description}</h4>
                <p>IP: ${activity.ip_address || 'Unknown'}</p>
            </div>
            <div class="activity-time">
                ${formatDateTime(activity.created_at)}
            </div>
        </div>
    `).join('');
}

// Load all emails
async function loadEmails() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/emails', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load emails');
        }
        
        const emails = await response.json();
        displayEmails(emails);
    } catch (error) {
        console.error('Error loading emails:', error);
        showError('Failed to load emails');
    }
}

// Display emails
function displayEmails(emails) {
    const emailsList = document.getElementById('emailsList');
    
    if (emails.length === 0) {
        emailsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <h3>No Emails Yet</h3>
                <p>Contact form submissions will appear here</p>
            </div>
        `;
        return;
    }
    
    emailsList.innerHTML = emails.map(email => `
        <div class="email-item ${email.status === 'unread' ? 'unread' : ''}" data-id="${email.id}">
            <div class="email-header">
                <div class="email-from">${email.name} &lt;${email.email}&gt;</div>
                <div class="email-time">${formatDateTime(email.created_at)}</div>
            </div>
            <div class="email-subject">${email.subject || 'No Subject'}</div>
            <div class="email-preview">${truncateText(email.message, 150)}</div>
            <div class="email-actions">
                ${email.status === 'unread' ? '<button class="btn btn-secondary" onclick="markAsRead(' + email.id + ')">Mark as Read</button>' : ''}
                ${email.status !== 'replied' ? '<button class="btn btn-primary" onclick="openReplyModal(' + email.id + ')">Reply</button>' : '<span class="btn btn-success">Replied</span>'}
            </div>
        </div>
    `).join('');
}

// Load all activities
async function loadActivities() {
    const activitiesList = document.getElementById('allActivitiesList');
    activitiesList.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading activities...</div>';
    
    if (dashboardData && dashboardData.activities) {
        displayAllActivities(dashboardData.activities);
    } else {
        // Reload if not available
        await loadDashboardData();
        displayAllActivities(dashboardData.activities);
    }
}

// Display all activities
function displayAllActivities(activities) {
    const activitiesList = document.getElementById('allActivitiesList');
    
    if (activities.length === 0) {
        activitiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No Activities Yet</h3>
                <p>Website activities will appear here</p>
            </div>
        `;
        return;
    }
    
    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${getActivityIconClass(activity.activity_type)}">
                <i class="fas ${getActivityIcon(activity.activity_type)}"></i>
            </div>
            <div class="activity-info">
                <h4>${activity.description}</h4>
                <p>IP: ${activity.ip_address || 'Unknown'} | User Agent: ${truncateText(activity.user_agent || 'Unknown', 50)}</p>
            </div>
            <div class="activity-time">
                ${formatDateTime(activity.created_at)}
            </div>
        </div>
    `).join('');
}

// Mark email as read
async function markAsRead(emailId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/emails/${emailId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark email as read');
        }
        
        // Reload emails and dashboard data
        loadEmails();
        loadDashboardData();
        
        showSuccess('Email marked as read');
    } catch (error) {
        console.error('Error marking email as read:', error);
        showError('Failed to mark email as read');
    }
}

// Open reply modal
async function openReplyModal(emailId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/emails', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load email details');
        }
        
        const emails = await response.json();
        const email = emails.find(e => e.id === emailId);
        
        if (!email) {
            throw new Error('Email not found');
        }
        
        currentEmail = email;
        
        // Populate modal content
        document.getElementById('originalEmailContent').innerHTML = `
            <p><strong>From:</strong> ${email.name} &lt;${email.email}&gt;</p>
            <p><strong>Subject:</strong> ${email.subject || 'No Subject'}</p>
            <p><strong>Date:</strong> ${formatDateTime(email.created_at)}</p>
            <hr>
            <p>${email.message.replace(/\n/g, '<br>')}</p>
        `;
        
        document.getElementById('replyMessage').value = '';
        document.getElementById('replyModal').style.display = 'block';
    } catch (error) {
        console.error('Error opening reply modal:', error);
        showError('Failed to open reply modal');
    }
}

// Close reply modal
function closeReplyModal() {
    document.getElementById('replyModal').style.display = 'none';
    currentEmail = null;
}

// Send reply
async function sendReply() {
    if (!currentEmail) {
        showError('No email selected');
        return;
    }
    
    const replyMessage = document.getElementById('replyMessage').value.trim();
    if (!replyMessage) {
        showError('Please enter a reply message');
        return;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/emails/${currentEmail.id}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                reply_message: replyMessage
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send reply');
        }
        
        showSuccess('Reply sent successfully!');
        closeReplyModal();
        
        // Reload emails and dashboard data
        loadEmails();
        loadDashboardData();
    } catch (error) {
        console.error('Error sending reply:', error);
        showError('Failed to send reply: ' + error.message);
    }
}

// Logout function
async function logout() {
    try {
        const token = localStorage.getItem('adminToken');
        await fetch('/api/admin/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin';
    }
}

// Utility functions
function getActivityIcon(type) {
    const icons = {
        'LOGIN_SUCCESS': 'sign-in-alt',
        'LOGIN_FAILED': 'exclamation-triangle',
        'LOGOUT': 'sign-out-alt',
        'CONTACT_FORM': 'envelope',
        'EMAIL_REPLY': 'reply'
    };
    return icons[type] || 'info-circle';
}

function getActivityIconClass(type) {
    const classes = {
        'LOGIN_SUCCESS': 'login',
        'LOGIN_FAILED': 'logout',
        'LOGOUT': 'logout',
        'CONTACT_FORM': 'contact',
        'EMAIL_REPLY': 'email'
    };
    return classes[type] || 'contact';
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showError(message) {
    // Create or update error message
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.querySelector('.main-content').prepend(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Create or update success message
    let successDiv = document.querySelector('.success-message');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        document.querySelector('.main-content').prepend(successDiv);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('replyModal');
    if (event.target === modal) {
        closeReplyModal();
    }
});

// Auto-refresh dashboard data every 30 seconds
setInterval(loadDashboardData, 30000);