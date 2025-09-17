# Deployment Guide

## Firebase Hosting Deployment

### Prerequisites
- Node.js installed
- Firebase CLI installed
- Firebase project created

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase Project
```bash
firebase init hosting
```
- Select your Firebase project
- Set public directory to `.` (current directory)
- Configure as single-page app: `Yes`
- Overwrite index.html: `No`

### Step 4: Update Project Configuration
Edit `.firebaserc` and replace `your-project-id` with your actual Firebase project ID.

### Step 5: Deploy
```bash
firebase deploy
```

## Important Notes

### Backend API Limitation
⚠️ **Important**: This application requires a PHP backend with MySQL database. Firebase Hosting only serves static files.

**Options for Backend:**
1. **Firebase Functions**: Convert PHP APIs to Firebase Functions
2. **External Hosting**: Host PHP backend separately (Heroku, DigitalOcean, etc.)
3. **Hybrid Approach**: Use Firebase for frontend, external service for API

### Recommended Architecture
```
Frontend (Firebase Hosting)
├── main.html
├── main.js
├── style.css
└── admin.html

Backend (External Service)
├── api/
│   ├── admin_stages.php
│   ├── admin_methods.php
│   └── db.php
└── MySQL Database
```

### Environment Configuration
Update API URLs in JavaScript files to point to your backend service:

```javascript
// In main.js and admin.js
const API_BASE_URL = 'https://your-backend-service.com/api/';
```

### Database Migration
1. Export MySQL database
2. Set up database on your chosen hosting service
3. Update database connection in `api/db.php`

## Alternative Hosting Options

### 1. Vercel (Recommended for Full-Stack)
- Supports PHP with serverless functions
- Easy deployment from GitHub
- Built-in database options

### 2. Netlify
- Static site hosting
- Serverless functions for API
- Form handling capabilities

### 3. Heroku
- Full-stack hosting
- MySQL add-ons available
- Easy PHP deployment

### 4. DigitalOcean App Platform
- Full-stack hosting
- Managed databases
- Auto-scaling

## Security Considerations

1. **API Security**: Implement authentication for admin endpoints
2. **CORS**: Configure proper CORS headers
3. **Input Validation**: Sanitize all user inputs
4. **Database Security**: Use prepared statements
5. **HTTPS**: Ensure all communications are encrypted

## Performance Optimization

1. **Image Optimization**: Compress images before upload
2. **Caching**: Implement proper cache headers
3. **CDN**: Use CDN for static assets
4. **Database Indexing**: Optimize database queries
5. **Lazy Loading**: Implement lazy loading for images

## Monitoring and Analytics

1. **Firebase Analytics**: Track user interactions
2. **Error Monitoring**: Implement error tracking
3. **Performance Monitoring**: Monitor page load times
4. **Database Monitoring**: Track database performance

## Backup Strategy

1. **Database Backups**: Regular automated backups
2. **File Backups**: Backup uploaded images
3. **Code Backups**: Version control with Git
4. **Configuration Backups**: Document all configurations
