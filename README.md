# Design Thinking Booklet

A comprehensive web application for Design Thinking methodology with an interactive booklet interface.

## Features

- **Interactive Booklet**: Digital booklet with page-flipping animations
- **Admin Panel**: Complete content management system
- **Mobile Responsive**: Optimized for mobile devices with touch gestures
- **Stage Management**: Create and manage Design Thinking stages
- **Method Library**: Comprehensive method database with images and descriptions
- **Search Functionality**: Full-text search across all content
- **Color-coded Modes**: Visual organization of methods by stages

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Libraries**: Axios for HTTP requests
- **Hosting**: Firebase Hosting ready

## Installation

### Local Development (XAMPP)

1. Clone the repository to your XAMPP htdocs folder
2. Start Apache and MySQL services
3. Import the database schema from `api/db.php`
4. Access the application at `http://localhost/lorem-ipsum/`

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize project: `firebase init hosting`
4. Deploy: `firebase deploy`

## File Structure

```
├── main.html              # Main application interface
├── main.js                # Frontend JavaScript logic
├── style.css              # Main stylesheet
├── admin.html             # Admin panel interface
├── admin.js               # Admin panel logic
├── admin.css              # Admin-specific styles
├── api/                   # PHP API endpoints
│   ├── db.php            # Database connection
│   ├── admin_stages.php  # Stage management API
│   ├── admin_methods.php # Method management API
│   └── ...               # Other API endpoints
├── firebase.json          # Firebase hosting configuration
├── .firebaserc           # Firebase project configuration
└── index.html            # Entry point for Firebase hosting
```

## API Endpoints

- `GET /api/admin_stages.php` - Fetch all stages
- `POST /api/admin_stages.php` - Create new stage
- `PUT /api/admin_stages.php` - Update stage
- `DELETE /api/admin_stages.php` - Delete stage
- `GET /api/admin_methods.php` - Fetch methods by stage
- `POST /api/admin_methods.php` - Create new method
- `PUT /api/admin_methods.php` - Update method
- `DELETE /api/admin_methods.php` - Delete method

## Database Schema

### Tables
- `stages` - Design Thinking stages
- `methods` - Individual methods/tools
- `method_sections` - Method content sections
- `method_stage` - Method-stage relationships
- `method_modes` - Method-mode relationships
- `modes` - Available modes/stages

## Mobile Features

- **Touch Gestures**: Swipe navigation
- **Page Flipping**: 3D page flip animations
- **Haptic Feedback**: Vibration on supported devices
- **Responsive Design**: Optimized for all screen sizes

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is for educational purposes. Please ensure you have proper licensing for any third-party content used.

## Support

For technical support or questions, please refer to the project documentation or contact the development team.
