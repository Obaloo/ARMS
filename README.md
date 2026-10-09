# ARMS

Cloud-based Attendance and Record Management System with separate frontend and backend applications.

## Structure

- `frontend` React application
- `backend` Node.js + Express API

## Backend Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set your MongoDB Atlas URI and JWT secrets
3. Install dependencies, seed defaults, and run:

```bash
cd backend
npm install
npm run seed:defaults
npm run dev
```

Backend endpoints are served at `http://localhost:5000/api`.
Swagger UI is available at `http://localhost:5000/api/docs`.

## Default Login Accounts

- Super Admin: `admin@arms.local` / `Admin123!`
- Lecturer: `lecturer@arms.local` / `Lecturer123!`
- Student A: `student1@arms.local` / `Student123!`
- Student B: `student2@arms.local` / `Student123!`
- Sample session code for attendance: `ARMS01`

## Frontend Setup

1. Install dependencies and run:

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000` and proxies API requests to backend.

## Implemented Modules

- JWT auth with refresh tokens and password reset flow
- Role-based access for super admin, lecturer, student
- Lecturer and student creation by super admin
- Course creation, reassignment, and enrollment
- Lecture session creation with open/close controls
- Attendance marking with code and geolocation payload
- Attendance override by lecturer or super admin
- Dashboard endpoints and role-specific frontend views
- Notifications and read-state management
- Reporting endpoints for JSON, CSV, and PDF
- System settings and feature flags
- Audit logging for key record updates
