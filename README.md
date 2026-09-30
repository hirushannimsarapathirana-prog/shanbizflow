# ShanBizFlow

**Business Management System**

ShanBizFlow is a modern, responsive business management system designed to help businesses manage their day-to-day operations from one centralized platform.

It provides modules for products, customers, sales, inventory, payments, reports, users, and system settings with authentication and role-based access.

## Description

**ShanBizFlow** is a modern and responsive **Business Management System** developed to simplify and organize daily business operations through a centralized platform.

The system provides dedicated modules for:

* Product Management
* Customer Management
* Sales Management
* Inventory Management
* Payment Management
* Business Reports
* User Management
* Authentication
* Role-Based Access Control
* System Settings

ShanBizFlow is designed with a responsive interface that works across **desktop, tablet, and mobile devices**.

The application also includes protected routes and session-based authentication to ensure that only authorized users can access business management features.

---

## ✨ Features

### 🔐 Authentication

* User Login
* User Registration
* Logout
* Session Verification
* Protected Routes
* Authentication State Management

### 📊 Dashboard

* Business overview
* Quick access to major modules
* Responsive dashboard layout
* Business management navigation

### 📦 Product Management

* Add products
* View products
* Manage product information
* Product navigation and management interface

### 👥 Customer Management

* Customer records
* Customer information
* Customer management interface

### 💰 Sales Management

* Sales management
* Invoice handling
* Sales information
* Payment status tracking

### 📦 Inventory Management

* Stock management
* Inventory monitoring
* Product stock information

### 💳 Payment Management

* Payment records
* Payment status
* Payment management interface

### 📈 Reports

* Business reports
* Sales-related information
* Management overview

### 👤 User Management

Super administrators can manage system users.

Supported roles include:

```text
SUPER_ADMIN
ADMIN
STAFF
```

### ⚙️ Settings

* System settings
* Application configuration interface
* User-friendly settings management

---

## 📱 Responsive Design

ShanBizFlow is designed to work across different screen sizes.

### Desktop

* Full navigation bar
* Fixed dashboard sidebar
* Large-screen dashboard layout
* Full management interface

### Mobile

* Responsive navigation bar
* Mobile hamburger menu
* Slide-out dashboard sidebar
* Mobile-friendly pages
* Responsive tables and content
* Touch-friendly buttons

---

## 🛠️ Technologies Used

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* JavaScript
* HTML5
* CSS3

### Backend / API

* Next.js API Routes
* REST-style API endpoints
* Session-based authentication

### Database

* SQL Database
* Database-backed business data management

### Development Tools

* IntelliJ IDEA
* Visual Studio Code
* Git
* GitHub
* npm

### Deployment

* Vercel

---

## 🏗️ Project Structure

```text
shanbizflow/
│
├── app/
│   ├── about/
│   ├── dashboard/
│   ├── products/
│   ├── customers/
│   ├── sales/
│   ├── inventory/
│   ├── payments/
│   ├── reports/
│   ├── users/
│   ├── settings/
│   ├── login/
│   ├── register/
│   │
│   ├── api/
│   │   └── auth/
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── Navbar.tsx
│   ├── DashboardSidebar.tsx
│   └── SessionGuard.tsx
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🔐 Security

The project includes authentication-related features such as:

* Session validation
* Protected application routes
* Login authentication
* Logout handling
* User role verification
* Super Admin access control
* Unauthorized user redirection

Protected pages are handled through the `SessionGuard` component.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hirushannimsarapathirana-prog/shanbizflow.git
```

### 2. Navigate to the project

```bash
cd shanbizflow
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🏭 Production Build

Create a production build:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

---

## 🌐 Deployment

The project is designed for deployment using **Vercel**.

After connecting the GitHub repository to Vercel, every new push to the configured branch can trigger a new deployment.

---

## 🔄 Git Workflow

After making changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Update ShanBizFlow"
```

Push:

```bash
git push origin main
```

---

## 🎯 Project Goals

The main goals of ShanBizFlow are:

* Simplify business management
* Centralize business information
* Improve daily workflow
* Reduce manual management
* Provide role-based access
* Provide responsive user experience
* Build a scalable business management platform

---

## 📚 Learning Purpose

This project is also developed as a practical learning project to improve skills in:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Authentication
* API development
* Database integration
* Responsive UI development
* Git & GitHub
* Vercel deployment
* Real-world software architecture

---

## 👨‍💻 Developer

**Hirushan Nimsara Pathirana**

GitHub:

**hirushannimsarapathirana-prog**

---

## 📌 Project Status

**Status:** 🚧 In Development

ShanBizFlow is continuously being improved with new business management features, UI improvements, authentication enhancements, and responsive design updates.

---

## 📄 License

This project is developed for educational and portfolio purposes.

---

⭐ If you find this project useful, consider giving the repository a star.
