# File Forge - SaaS File Management System

A modern SaaS file management system with a scalable backend and responsive frontend.

## Project Structure

This is a monorepo containing:

- **backend/** - Node.js/Express backend with Prisma ORM
- **frontend/** - Next.js React frontend

## Getting Started

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Quick Links

- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

## Architecture

The system is designed as a modular monorepo to facilitate:
- Independent deployment of frontend and backend
- Shared development workflows
- Clear separation of concerns
