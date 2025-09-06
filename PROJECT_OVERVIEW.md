# Design Thinking Booklet - Project Overview

## 📚 What is this project?
This is a **Design Thinking Booklet** web application that helps students learn and apply design thinking methodologies. It's like a digital deck of cards with tools and methods for each stage of the design thinking process.

## 🎯 Main Features
- **Interactive Booklet**: Students can browse methods in a beautiful, book-like interface
- **5 Design Thinking Stages**: Empathize, Define, Ideate, Prototype, Test
- **Mobile Responsive**: Works perfectly on phones and tablets
- **Search Functionality**: Find methods quickly
- **Admin Panel**: Teachers can manage content easily

## 📁 File Structure & Purpose

### 🎨 Frontend Files (Student Interface)
- **`main.html`** - Main student interface with sidebar navigation and booklet modal
- **`main.js`** - All JavaScript for student interactions, booklet functionality, mobile features
- **`style.css`** - Complete styling for both admin and main app (responsive design)

### ⚙️ Admin Files (Teacher Interface)
- **`admin.html`** - Administrative panel for managing content
- **`admin.js`** - JavaScript for admin functions (CRUD operations, drag & drop, image upload)

### 🗄️ Backend Files (Database & APIs)
- **`api/db.php`** - Database connection and table creation
- **`api/admin_stages.php`** - API for managing design thinking stages
- **`api/admin_methods.php`** - API for managing methods within stages
- **`api/admin_sections.php`** - API for managing detailed method sections
- **`api/get_method.php`** - API for retrieving individual methods
- **`api/get_sections.php`** - API for retrieving method sections
- **`api/methods.php`** - API for frontend method retrieval
- **`api/stages.php`** - API for frontend stage retrieval

## 🎪 Where is the Booklet?
The main booklet is located in:
- **HTML**: `<div id="method-modal">` in `main.html` (lines ~80-120)
- **JavaScript**: `openMethodBooklet()` function in `main.js` (around line 350)
- **CSS**: `.booklet` and `.method-modal` styles in `style.css` (around line 800)

## 🚀 How to Run
1. Start XAMPP (Apache + MySQL)
2. Open `http://localhost/lorem%20ipsum/main.html` for students
3. Open `http://localhost/lorem%20ipsum/admin.html` for teachers

## 🎓 For Teachers
- Use the **Admin Panel** to create and manage content
- Add methods to each design thinking stage
- Upload images for visual learning
- Organize methods with drag & drop
- All changes appear instantly in the student interface

## 📱 Mobile Features
- Hamburger menu for navigation
- Swipe gestures to go back
- Page flipping in booklet
- Touch-friendly interface
- Responsive design for all screen sizes

## 🎨 Design Features
- Color-coded stages (each stage has its own color)
- Professional, modern interface
- Smooth animations and transitions
- Glassmorphism effects
- Interactive elements with hover effects

---
*This project demonstrates modern web development with HTML5, CSS3, JavaScript, PHP, and MySQL.*
