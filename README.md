ConnecTED Server

**A comprehensive backend API for the ConnecTED School Management Platform**

ConnecTED Server is a robust Node.js/Express backend service that powers the ConnecTED school management system, providing secure authentication, real-time messaging, attendance tracking, grade management, and administrative controls for educational institutions.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Data Models](#data-models)
- [Services & Utilities](#services--utilities)
- [Database](#database)
- [Real-Time Communication](#real-time-communication)
- [Security Features](#security-features)
- [Scripts](#scripts)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

ConnecTED Server is the backend API for a comprehensive school management platform. It handles:

- **User Management**: Admin, teacher, and parent account management with role-based access control (RBAC)
- **Authentication**: Firebase-based authentication with JWT tokens and session management
- **Academic Management**: Students, classes, grades, attendance, and homework tracking
- **Communication**: Real-time messaging between parents, teachers, and administrators
- **Notifications**: Push notifications via Firebase Cloud Messaging (FCM)
- **Analytics**: School-wide statistics and performance metrics
- **Audit Logging**: Comprehensive tracking of all sensitive operations

The server uses **MongoDB** for data persistence and **Firebase** for user authentication and identity management.

---

## ✨ Features

### Core Features

- ✅ **Role-Based Access Control (RBAC)** - Granular permission system for Admin, Teacher, and Parent roles
- ✅ **Firebase Authentication** - Secure signup/login with JWT token management
- ✅ **Account Approval System** - Teachers and parents require admin approval before access
- ✅ **User Profile Management** - Profile picture, contact info, and role-specific data
- ✅ **Student Management** - Complete student records with class assignments
- ✅ **Class Management** - Create and manage classes with teacher and student assignments
- ✅ **Academic Records** - Grades, attendance, and homework tracking
- ✅ **Real-Time Messaging** - Socket.IO-powered instant messaging between users
- ✅ **Notifications** - FCM-based push notifications and in-app alerts
- ✅ **Announcements** - Role and class-based broadcast announcements
- ✅ **Events Management** - School events with RSVP functionality
- ✅ **Analytics Dashboard** - Real-time statistics for school metrics
- ✅ **Audit Logging** - Complete audit trail of sensitive operations
- ✅ **Health Checks** - API health monitoring with database status

### Security Features

- 🔒 **Helmet.js** - HTTP security headers
- 🔒 **CORS Protection** - Configurable cross-origin resource sharing
- 🔒 **Rate Limiting** - Protection against brute-force attacks
- 🔒 **Input Validation** - Request payload validation
- 🔒 **Cache Control** - Prevents sensitive data caching
- 🔒 **Token Verification** - Firebase ID token and session cookie validation
- 🔒 **Encrypted Credentials** - Firebase service account credentials management

---

## 🛠️ Tech Stack

| Category                    | Technology                     |
| --------------------------- | ------------------------------ |
| **Runtime**                 | Node.js with TypeScript        |
| **Framework**               | Express.js                     |
| **Database**                | MongoDB (Atlas)                |
| **Authentication**          | Firebase Admin SDK             |
| **Real-Time Communication** | Socket.IO                      |
| **Email Service**           | Nodemailer (Gmail/SMTP)        |
| **File Storage**            | Cloudinary                     |
| **Payment**                 | Paystack API                   |
| **Logging**                 | Winston                        |
| **Security**                | Helmet.js, CORS, Rate Limiting |
| **HTTP Logging**            | Morgan                         |

---

## 📁 Project Structure

```
server/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── app.ts                   # Express app configuration
│   ├── declarations.d.ts        # TypeScript declarations
│   ├── config/
│   │   ├── db.ts               # MongoDB connection configuration
│   │   ├── firebase.ts         # Firebase Admin SDK setup
│   │   └── socket.ts           # Socket.IO configuration
│   ├── models/                 # MongoDB Mongoose schemas
│   │   ├── User.ts             # User schema (admin, teacher, parent)
│   │   ├── Student.ts          # Student records
│   │   ├── Class.ts            # Class definitions
│   │   ├── Grade.ts            # Grade records
│   │   ├── Attendance.ts       # Attendance tracking
│   │   ├── Homework.ts         # Homework assignments
│   │   ├── Message.ts          # User messages
│   │   ├── Notification.ts     # Notifications
│   │   ├── Announcement.ts     # Announcements
│   │   ├── Event.ts            # Events
│   │   ├── AuditLog.ts         # Audit logs
│   │   ├── Program.ts          # Academic programs
│   │   └── SubjectGroup.ts     # Subject groupings
│   ├── controllers/            # Route handlers
│   │   ├── auth.controller.ts       # Auth endpoints
│   │   ├── users.controller.ts      # User management
│   │   ├── students.controller.ts   # Student operations
│   │   ├── classes.controller.ts    # Class operations
│   │   ├── grades.controller.ts     # Grade management
│   │   ├── attendance.controller.ts # Attendance tracking
│   │   ├── homework.controller.ts   # Homework management
│   │   ├── messages.controller.ts   # Messaging
│   │   ├── notifications.controller.ts
│   │   ├── announcements.controller.ts
│   │   ├── events.controller.ts
│   │   ├── analytics.controller.ts  # Statistics
│   │   ├── audit.controller.ts      # Audit logs
│   │   └── ...
│   ├── routes/                 # API route definitions
│   │   ├── index.ts            # Route aggregation
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── students.ts
│   │   ├── classes.ts
│   │   ├── grades.ts
│   │   ├── attendance.ts
│   │   ├── messages.ts
│   │   └── ...
│   ├── middleware/             # Custom middleware
│   │   ├── auth.middleware.ts      # Token verification, role checking
│   │   ├── audit.middleware.ts     # Audit logging
│   │   └── rateLimiter.ts          # Rate limiting
│   ├── services/               # Business logic
│   │   ├── audit.service.ts    # Audit log creation
│   │   ├── notification.service.ts # Notification creation
│   │   ├── email.service.ts    # Email operations
│   │   └── logger.ts           # Winston logger
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── seed/
│       ├── seed.ts             # Database seeding
│       └── data.ts             # Seed data
├── scripts/                    # Utility scripts
│   ├── setup-admin.ts          # Create initial admin
│   ├── cleanup-users.ts        # Clean up test users
│   ├── seed-production-data.ts # Production data seeding
│   └── create-default-logins.ts
├── dist/                       # Compiled JavaScript output
├── .env                        # Environment variables (gitignored)
├── .env.example                # Example environment file
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16.x or higher
- **npm** or **yarn**
- **MongoDB** Atlas account (or local MongoDB instance)
- **Firebase** project with Admin SDK credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/KhobbyLynx/ConnecTED_Server.git
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**

   **Development mode:**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm run build
   npm start
   ```

The server will start on `http://localhost:5000` (or the PORT specified in `.env`)

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# GENERAL
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:4173

# MONGODB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# FIREBASE
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com

# CLOUDINARY (Optional - for file uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Service Accounts** (Project Settings → Service Accounts)
4. Generate a new private key
5. Copy the credentials to your `.env` file

### Getting MongoDB URI

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string from the **Connect** button
4. Add to `.env` as `MONGO_URI`

---

## 📡 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method   | Endpoint                | Description                | Auth Required        |
| -------- | ----------------------- | -------------------------- | -------------------- |
| `POST`   | `/auth/register`        | Register new user          | Bearer Token         |
| `GET`    | `/auth/me`              | Get current user           | Bearer Token         |
| `PATCH`  | `/auth/me`              | Update profile             | Bearer Token         |
| `POST`   | `/auth/approve/:userId` | Admin approves user        | Bearer Token + Admin |
| `DELETE` | `/auth/reject/:userId`  | Admin rejects/deletes user | Bearer Token + Admin |
| `POST`   | `/auth/fcm-token`       | Update FCM token           | Bearer Token         |
| `POST`   | `/auth/logout`          | Logout user                | Bearer Token         |
| `GET`    | `/health`               | Health check               | No                   |

### User Management Endpoints

| Method   | Endpoint           | Description               | Auth Required  |
| -------- | ------------------ | ------------------------- | -------------- |
| `GET`    | `/users`           | Get all users (paginated) | Bearer + Admin |
| `GET`    | `/users/:id`       | Get specific user         | Bearer + Admin |
| `PUT`    | `/users/:id`       | Update user               | Bearer + Admin |
| `DELETE` | `/users/:id`       | Delete user               | Bearer + Admin |
| `POST`   | `/users/:id/email` | Send email to user        | Bearer + Admin |

### Student Management Endpoints

| Method   | Endpoint        | Description          | Auth Required  |
| -------- | --------------- | -------------------- | -------------- |
| `GET`    | `/students`     | Get all students     | Bearer         |
| `GET`    | `/students/:id` | Get specific student | Bearer         |
| `POST`   | `/students`     | Create student       | Bearer + Admin |
| `PUT`    | `/students/:id` | Update student       | Bearer + Admin |
| `DELETE` | `/students/:id` | Delete student       | Bearer + Admin |

### Class Management Endpoints

| Method   | Endpoint       | Description        | Auth Required  |
| -------- | -------------- | ------------------ | -------------- |
| `GET`    | `/classes`     | Get all classes    | Bearer         |
| `GET`    | `/classes/:id` | Get specific class | Bearer         |
| `POST`   | `/classes`     | Create class       | Bearer + Admin |
| `PUT`    | `/classes/:id` | Update class       | Bearer + Admin |
| `DELETE` | `/classes/:id` | Delete class       | Bearer + Admin |

### Grade Management Endpoints

| Method   | Endpoint      | Description  | Auth Required    |
| -------- | ------------- | ------------ | ---------------- |
| `GET`    | `/grades`     | Get grades   | Bearer           |
| `POST`   | `/grades`     | Create grade | Bearer + Teacher |
| `PUT`    | `/grades/:id` | Update grade | Bearer + Teacher |
| `DELETE` | `/grades/:id` | Delete grade | Bearer + Admin   |

### Attendance Endpoints

| Method | Endpoint          | Description            | Auth Required    |
| ------ | ----------------- | ---------------------- | ---------------- |
| `GET`  | `/attendance`     | Get attendance records | Bearer           |
| `POST` | `/attendance`     | Record attendance      | Bearer + Teacher |
| `PUT`  | `/attendance/:id` | Update attendance      | Bearer + Teacher |

### Homework Endpoints

| Method | Endpoint        | Description     | Auth Required    |
| ------ | --------------- | --------------- | ---------------- |
| `GET`  | `/homework`     | Get homework    | Bearer           |
| `POST` | `/homework`     | Create homework | Bearer + Teacher |
| `PUT`  | `/homework/:id` | Update homework | Bearer + Teacher |

### Messaging Endpoints

| Method   | Endpoint        | Description    | Auth Required |
| -------- | --------------- | -------------- | ------------- |
| `GET`    | `/messages`     | Get messages   | Bearer        |
| `POST`   | `/messages`     | Send message   | Bearer        |
| `DELETE` | `/messages/:id` | Delete message | Bearer        |

### Notifications Endpoints

| Method | Endpoint                   | Description       | Auth Required |
| ------ | -------------------------- | ----------------- | ------------- |
| `GET`  | `/notifications`           | Get notifications | Bearer        |
| `POST` | `/notifications/mark-read` | Mark as read      | Bearer        |

### Announcements Endpoints

| Method | Endpoint             | Description         | Auth Required          |
| ------ | -------------------- | ------------------- | ---------------------- |
| `GET`  | `/announcements`     | Get announcements   | Bearer                 |
| `POST` | `/announcements`     | Create announcement | Bearer + Admin/Teacher |
| `PUT`  | `/announcements/:id` | Update announcement | Bearer + Creator       |

### Events Endpoints

| Method | Endpoint           | Description   | Auth Required  |
| ------ | ------------------ | ------------- | -------------- |
| `GET`  | `/events`          | Get events    | Bearer         |
| `POST` | `/events`          | Create event  | Bearer + Admin |
| `POST` | `/events/:id/rsvp` | RSVP to event | Bearer         |

### Analytics Endpoints

| Method | Endpoint            | Description         | Auth Required  |
| ------ | ------------------- | ------------------- | -------------- |
| `GET`  | `/analytics/stats`  | Get dashboard stats | Bearer + Admin |
| `GET`  | `/analytics/trends` | Get trend data      | Bearer + Admin |

### Audit Log Endpoints

| Method | Endpoint     | Description            | Auth Required  |
| ------ | ------------ | ---------------------- | -------------- |
| `GET`  | `/audit`     | Get audit logs         | Bearer + Admin |
| `GET`  | `/audit/:id` | Get specific audit log | Bearer + Admin |

---

## 🔑 Authentication & Authorization

### Firebase Authentication Flow

1. **Frontend Sign Up**: User signs up via Firebase
2. **ID Token**: Firebase provides an ID token to the frontend
3. **API Request**: Frontend sends ID token in `Authorization: Bearer <token>` header
4. **Token Verification**: Backend verifies token using Firebase Admin SDK
5. **User Lookup**: Backend fetches user from MongoDB using Firebase UID

### Role-Based Access Control (RBAC)

Three main roles with hierarchical permissions:

#### Admin

- Full system access
- User management (create, read, update, delete, approve)
- Student and class management
- Grade and attendance management
- View audit logs
- Create announcements and events

#### Teacher

- Read-only access to students and classes
- Create and manage grades and attendance
- Create homework assignments
- Send messages to parents/admins
- Create announcements and events
- Receive notifications

#### Parent

- View own children's information
- Read-only access to grades and attendance
- Send messages to teachers/admins
- View announcements
- RSVP to events
- Receive notifications

### Permission System

Default permissions by role (defined in `src/models/User.ts`):

```typescript
admin: [
	'users:read',
	'users:write',
	'users:delete',
	'users:approve',
	'students:read',
	'students:write',
	'students:delete',
	'classes:read',
	'classes:write',
	'classes:delete',
	'grades:read',
	'grades:write',
	'attendance:read',
	'attendance:write',
	'homework:read',
	'homework:write',
	'messages:read',
	'messages:write',
	'announcements:read',
	'announcements:write',
	'events:read',
	'events:write',
	'events:rsvp',
	'notifications:read',
	'notifications:write',
	'audit:read'
]

teacher: [
	'students:read',
	'classes:read',
	'grades:read',
	'grades:write',
	'attendance:read',
	'attendance:write',
	'homework:read',
	'homework:write',
	'messages:read',
	'messages:write',
	'announcements:read',
	'announcements:write',
	'events:read',
	'events:write',
	'events:rsvp',
	'notifications:read'
]

parent: [
	'students:read',
	'classes:read',
	'grades:read',
	'attendance:read',
	'homework:read',
	'messages:read',
	'messages:write',
	'announcements:read',
	'events:read',
	'events:rsvp',
	'notifications:read'
]
```

### Middleware Usage

```typescript
// Verify token and attach user to request
router.use(verifyToken)

// Require specific roles
router.post('/admin-only', requireRole('admin'), controller)

// Require account approval
router.get('/profile', requireApproval, controller)
```

---

## 📊 Data Models

### User Model

Stores all user accounts with role-specific data.

**Fields:**

- `firebaseUid` (string): Unique Firebase ID
- `email` (string): User email
- `name` (string): Full name
- `role` (string): 'admin' | 'teacher' | 'parent'
- `isApproved` (boolean): Account approval status
- `permissions` (array): Role-based permissions
- `phone` (string): Contact number
- `profilePicture` (string): Profile image URL
- `isOnline` (boolean): Current online status
- `lastLoginAt` (date): Last login timestamp
- `fcmTokens` (array): Firebase Cloud Messaging tokens
- `parentData` (object): Parent-specific fields
- `teacherData` (object): Teacher-specific fields
- `adminData` (object): Admin-specific fields

### Student Model

Academic records for students.

**Fields:**

- `id` (string): Unique identifier
- `name` (string): Student name
- `admissionNumber` (string): School admission code
- `classId` (ref): Reference to Class
- `parentIds` (array): References to parent Users
- `dateOfBirth` (date): DOB
- `previousSchool` (string): Previous school name
- `status` (string): 'active' | 'inactive'

### Class Model

Classroom definitions.

**Fields:**

- `id` (string): Unique identifier
- `name` (string): Class name (e.g., "Primary 1A")
- `grade` (string): Grade level
- `section` (string): Class section
- `teacherIds` (array): Teacher assignments
- `studentIds` (array): Student roster
- `academicYear` (string): Academic year

### Grade Model

Student grades for subjects.

**Fields:**

- `studentId` (ref): Reference to Student
- `classId` (ref): Reference to Class
- `subject` (string): Subject name
- `score` (number): Numeric grade
- `grade` (string): Letter grade (A-F)
- `term` (string): Academic term
- `year` (number): Academic year
- `issuedAt` (date): Date issued

### Attendance Model

Attendance records.

**Fields:**

- `studentId` (ref): Reference to Student
- `classId` (ref): Reference to Class
- `date` (date): Attendance date
- `status` (string): 'present' | 'absent' | 'late' | 'excused'
- `markedBy` (ref): Teacher who marked attendance
- `remarks` (string): Additional notes

### Homework Model

Homework assignments.

**Fields:**

- `title` (string): Assignment title
- `description` (string): Detailed description
- `subject` (string): Subject
- `classId` (ref): Target class
- `dueDate` (date): Due date
- `createdBy` (ref): Teacher ID
- `submissions` (array): Student submissions with timestamps
- `createdAt` (date): Creation date

### Message Model

P2P messaging between users.

**Fields:**

- `senderId` (ref): Sender User ID
- `recipientId` (ref): Recipient User ID
- `content` (string): Message text
- `attachments` (array): File URLs
- `isRead` (boolean): Read status
- `createdAt` (date): Message timestamp

### Notification Model

In-app notifications.

**Fields:**

- `userId` (ref): Target user
- `type` (string): Notification type
- `title` (string): Notification title
- `body` (string): Notification body
- `icon` (string): Icon URL
- `actionUrl` (string): Navigation URL
- `isRead` (boolean): Read status
- `createdAt` (date): Creation timestamp

### Announcement Model

Broadcast announcements.

**Fields:**

- `title` (string): Announcement title
- `content` (string): Announcement body
- `targetAudience` (string): 'all' | 'teachers' | 'parents' | 'specific_class'
- `classIds` (array): Target classes if applicable
- `createdBy` (ref): Creator User ID
- `createdAt` (date): Creation timestamp
- `expiresAt` (date): Expiration date

### AuditLog Model

Audit trail for sensitive operations.

**Fields:**

- `action` (string): Action performed
- `userId` (ref): User who performed action
- `targetModel` (string): Model affected
- `targetId` (string): Record affected
- `changes` (object): Before/after values
- `ipAddress` (string): Client IP
- `userAgent` (string): Browser info
- `timestamp` (date): Operation timestamp
- `status` (string): 'success' | 'failure'

---

## 🧠 Services & Utilities

### Audit Service

Logs all sensitive operations to MongoDB.

```typescript
// src/services/audit.service.ts
import { createAuditLog } from './audit.service'

await createAuditLog({
	action: 'USER_CREATED',
	userId: req.user._id,
	targetModel: 'User',
	targetId: newUser._id,
	changes: { created: newUser }
})
```

### Notification Service

Creates in-app notifications and can trigger FCM push notifications.

```typescript
// src/services/notification.service.ts
import { createNotification } from './notification.service'

await createNotification({
	userId: targetUserId,
	type: 'USER_APPROVED',
	title: 'Account Approved',
	body: 'Your account has been approved'
})
```

### Email Service

Sends emails via Gmail SMTP.

```typescript
// src/services/email.service.ts
import { sendEmail } from './email.service'

await sendEmail({
	to: 'recipient@example.com',
	subject: 'Account Approved',
	html: '<h1>Welcome!</h1>'
})
```

### Logger

Winston-based logging service.

```typescript
// src/services/logger.ts
import Logger from './logger'

Logger.info('Operation successful')
Logger.error('Something went wrong')
Logger.warn('Warning message')
Logger.debug('Debug info')
```

---

## 💾 Database

### MongoDB Atlas Connection

The server connects to MongoDB Atlas via mongoose with connection pooling.

**Connection Configuration:**

- **Max Pool Size**: 50 connections
- **Buffer Commands**: Disabled for better error handling
- **Authentication**: Username/password with IP whitelisting

### Mongoose Schemas

All MongoDB collections are defined using Mongoose schemas in `src/models/`:

```typescript
// Example schema structure
const userSchema = new Schema({
	firebaseUid: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	role: { type: String, enum: ['admin', 'teacher', 'parent'], required: true },
	isApproved: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now }
})
```

### Database Indexes

Critical indexes are created automatically by Mongoose:

- User: `firebaseUid`, `email`
- Student: `admissionNumber`, `classId`
- Attendance: `studentId`, `date`
- Grade: `studentId`, `subject`, `term`

---

## 🔄 Real-Time Communication

### Socket.IO Configuration

Located in `src/config/socket.ts`, Socket.IO enables real-time features:

**Supported Events:**

- `message` - Real-time messaging
- `user_online` - User online status
- `notification` - Push notifications
- `typing` - Typing indicators
- `presence_update` - Presence tracking

**Usage Example:**

```typescript
// Frontend
socket.emit('message', { recipientId: '123', content: 'Hello!' })
socket.on('message', (msg) => console.log(msg))

// Backend (in socket configuration)
socket.on('message', async (data) => {
	// Handle message
})
```

---

## 🔒 Security Features

### HTTP Headers (Helmet.js)

```typescript
app.use(helmet())
```

Protects against:

- XSS attacks
- Clickjacking
- MIME type sniffing
- Insecure SSL/TLS

### CORS Protection

```typescript
cors({
	origin: allowedOrigins, // Only specified origins
	credentials: true // Allow cookies
})
```

### Cache Control

```typescript
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
res.setHeader('Pragma', 'no-cache')
```

Prevents sensitive data from being cached by browsers.

### Rate Limiting

Protects against brute-force attacks:

```typescript
// src/middleware/rateLimiter.ts
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100 // 100 requests per window
	})
)
```

### Input Validation

Request payloads are validated before processing:

```typescript
if (!email || !password) {
	return res.status(400).json({ error: 'Missing required fields' })
}
```

### Error Handling

Sensitive errors are sanitized for production:

```typescript
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": "..."  // Only in development
}
```

Stack traces and internal MongoDB errors are **never** exposed to clients.

---

## 📜 Scripts

### Setup Admin User

Create an initial admin account:

```bash
npm run setup-admin
```

**What it does:**

- Creates an admin user in MongoDB
- Sets `isApproved: true`
- Assigns all admin permissions

### Clean Up Users

Remove test/temporary users:

```bash
npm run cleanup-users
```

### Seed Production Data

Populate the database with realistic data:

```bash
npm run seed-data
```

Creates sample:

- Users (admins, teachers, parents)
- Students
- Classes
- Grades
- Attendance records

### Create Default Logins

Generate default test login credentials:

```bash
npm run create-logins
```

---

## 🔧 Development

### Development Server

Run with hot reload using Nodemon:

```bash
npm run dev
```

Watches for file changes and automatically restarts the server.

### Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

Output goes to `dist/` directory.

### File Watching

TypeScript files are automatically compiled when changed during development.

### Debugging

Enable debug logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development npm run dev
```

Logs will include:

- HTTP requests (Morgan)
- Database queries
- Authentication flows
- Error stack traces

---

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**

   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=<production_mongodb_uri>
   FIREBASE_*=<production_firebase_creds>
   CLIENT_URL=https://yourapp.com
   ```

2. **Build the Application**

   ```bash
   npm install
   npm run build
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

### Deployment Platforms

#### Render.com

```yaml
# render.yaml
services:
  - type: web
    name: connected-server
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        value: $MONGO_URI
```

#### Heroku

```bash
heroku create connected-server
heroku config:set MONGO_URI=<your_uri>
git push heroku main
```

#### PM2 (Self-Hosted)

```bash
pm2 start dist/index.js --name "connected-server"
pm2 save
pm2 startup
```

### Database Backup

For MongoDB Atlas:

1. Go to **Atlas Dashboard**
2. Select **Backup** → **Create On-Demand Backup**
3. Automated backups are daily by default

---

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error

**Error**: `querySrv ECONNREFUSED _mongodb._tcp.cluster.mongodb.net`

**Solution**:

```typescript
// Already fixed in index.ts
import dns from 'node:dns/promises'
dns.setServers(['1.1.1.1', '1.0.0.1'])
```

#### Firebase Token Verification Failed

**Error**: `Invalid token or session`

**Causes & Solutions**:

- Token expired: Request new token from frontend
- Wrong credentials: Check Firebase config in `.env`
- CORS issue: Verify `CLIENT_URL` is in allowed origins

#### CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:

```env
CLIENT_URL=http://localhost:4173  # Match frontend URL
```

#### User Not Found After Login

**Issue**: User logs in but `/auth/me` returns null

**Causes**:

- Firebase UID doesn't match MongoDB user
- User not registered yet

**Solution**:

1. Ensure `/auth/register` is called after signup
2. Check Firebase UID is correctly stored in MongoDB

#### Rate Limiting Too Strict

**Issue**: Users getting "Too many requests" errors

**Solution**: Adjust rate limiter in `middleware/rateLimiter.ts`:

```typescript
rateLimit({
	windowMs: 15 * 60 * 1000, // Increase window
	max: 100 // Increase limit
})
```

### Debugging Techniques

#### Enable Debug Logging

```env
NODE_ENV=development
DEBUG=*
```

#### Check Database Connection

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
	"status": "API is healthy",
	"database": "connected",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"version": "1.0.0"
}
```

#### View Audit Logs

```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/audit
```

#### Check Firebase Configuration

```bash
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID)"
```

### Log Files

Logs are output to console and captured by Docker/PM2:

- **Development**: Colorized console output
- **Production**: JSON format for log aggregation

Access logs on deployment platforms:

- **Render**: Logs tab in dashboard
- **Heroku**: `heroku logs -t`
- **PM2**: `pm2 logs connected-server`

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Socket.IO Documentation](https://socket.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📝 License

ISC

---

## 👥 Contributing

For contribution guidelines, please see the main ConnecTED repository.

---

**Last Updated**: 2024
**Version**: 1.0.0"
