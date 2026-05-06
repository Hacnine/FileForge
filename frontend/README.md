# SaaS File Management System — Frontend

React SPA built with **Vite · TypeScript · Tailwind CSS · shadcn/ui · Redux Toolkit (RTK Query)**.

Live URL: *(set after Netlify deploy)*
https://hasanainfileforge.netlify.app
---

## Demo Accounts

These accounts are pre-seeded in the backend — click the quick-login cards on the login page to auto-fill.

| Role  | Email                          | Password   |
|-------|--------------------------------|------------|
| Admin | admin@saasfilemanager.com      | Admin@123  |
| User  | user1@saasfilemanager.com      | User1@123  |
| User  | user2@saasfilemanager.com      | User2@123  |

---

## Tech Stack

| Layer         | Technology                                  |
|---------------|---------------------------------------------|
| Build tool    | Vite 6                                      |
| Language      | TypeScript 5                                |
| UI framework  | React 18                                    |
| Styling       | Tailwind CSS v4                             |
| Components    | shadcn/ui (Card, Badge, Button, Dialog, …)  |
| State / API   | Redux Toolkit + RTK Query                   |
| Routing       | React Router v7                             |
| Icons         | Lucide React                                |
| Notifications | react-hot-toast                             |
| Deployment    | Netlify                                     |

---

## Project Structure

```
src/
├── main.tsx
├── App.tsx                     # Route definitions
├── index.css
├── components/
│   ├── GuestRoute.tsx          # Redirects logged-in users away from auth pages
│   ├── ProtectedRoute.tsx      # Redirects unauthenticated users to login
│   └── ui/                     # shadcn/ui primitives
├── contexts/
│   └── AuthContext.tsx         # Auth state provider (login / logout / profile refresh)
├── pages/
│   ├── HomePage.tsx            # Landing page with package info
│   ├── auth/
│   │   ├── LoginPage.tsx       # Login form + quick-login demo cards
│   │   ├── RegisterPage.tsx    # Registration form
│   │   ├── VerifyEmailPage.tsx # Email verification handler
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   └── dashboard/
│       ├── DashboardPage.tsx   # Overview with role-aware quick-action cards
│       ├── FileManagerPage.tsx # Folder tree + file upload/management UI
│       └── PackagesPage.tsx    # Admin: package CRUD | User: subscribe/history
├── services/                   # RTK Query endpoint definitions
│   ├── authApi.ts
│   ├── fileManagerApi.ts
│   ├── packagesApi.ts
│   ├── publicPackagesApi.ts
│   └── userApi.ts
├── store/
│   ├── index.ts                # Redux store
│   ├── authSlice.ts            # Access & refresh token state
│   └── baseApi.ts              # RTK Query base with auto-refresh interceptor
├── types/
│   └── index.ts                # Shared TypeScript interfaces
└── utils/
    └── errorHelper.ts          # RTK Query error message extractor
```

---

## Core Features

### Authentication
- **Login** — JWT access + refresh token; tokens stored in Redux, refresh token persisted
- **Register** — Full name, email, password; triggers verification email
- **Email Verification** — Token-based; page handles redirect from email link
- **Forgot / Reset Password** — Two-step flow with emailed reset link
- **Auto token refresh** — RTK Query base query automatically refreshes the access token on 401 and retries the original request; logs out on refresh failure

### Admin Panel
- View all subscription packages
- **Create** new package with all limits (maxFolders, maxNestingLevel, allowedFileTypes, maxFileSize, totalFileLimit, filesPerFolder)
- **Edit** any package inline via dialog
- **Delete** package with confirmation

### User Panel
- View all available packages with limits displayed
- **Subscribe** to a package
- **Unsubscribe** and switch to a different plan
- View full **subscription history** with dates

### File Manager
- Hierarchical **folder tree** view
- **Create root folders** and **sub-folders** (depth controlled by subscription)
- **Rename** and **delete** folders
- **Upload files** (Image, Video, PDF, Audio) — validated against subscription limits
- View all files in a selected folder
- **Rename**, **move**, and **delete** files
- File metadata shown (size, type, upload date)

### Dashboard
- Role-aware welcome card (Admin vs User)
- Email-not-verified warning banner
- Quick-action cards: Manage Packages / My Subscription, My Folders, My Files
- **Admin info card** — shows admins have no upload/folder restrictions

---

## Extra Features Added

| Feature | Detail |
|---------|--------|
| **Quick-login demo cards** | Login page shows clickable cards for all 3 seeded accounts — auto-fills email & password |
| **Auto token refresh interceptor** | RTK Query retries failed requests after refreshing JWT; no manual re-login needed |
| **Guest / Protected routing** | `GuestRoute` and `ProtectedRoute` wrappers prevent wrong-role navigation |
| **Role-based UI** | Admin sees package management; User sees subscription and file controls |
| **Subscription history view** | Users can see a dated log of all past and current packages |
| **Subscription status** | Live quota/limit display showing current usage vs allowed |
| **react-hot-toast notifications** | Success and error toasts on every async action |
| **Email verification flow** | Full token-based verification page driven by email link |
| **Password reset flow** | Forgot-password + reset-password pages with token validation |
| **netlify.toml SPA redirect** | `/* → /index.html` ensures page reloads work on Netlify |

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/Hacnine/SaaSFileManagementSystemFrontend.git
cd SaaSFileManagementSystemFrontend
npm install

# 2. Set environment variable
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

## Production Build

```bash
npm run build
# Output in dist/ — deploy to Netlify / any static host
```

## Environment Variables

| Variable            | Description                                      |
|---------------------|--------------------------------------------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `https://…/api`)     |

> In Netlify: go to **Site settings → Environment variables** and set `VITE_API_BASE_URL` to your Render backend URL (`https://saasfilemanagementsystembackend.onrender.com/api`).
