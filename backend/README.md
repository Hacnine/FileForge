# FileForge — Backend API

Enterprise-grade SaaS file management REST API built with **Node.js · Express · TypeScript · Prisma ORM · PostgreSQL**.

Live API: `https://fileforge9.netlify.app`  

---

## How the Project Works

### Request Lifecycle

```
Browser / Mobile Client
        │
        ▼
  [Next.js Frontend]  ──── sends JWT in Authorization header or httpOnly cookie
        │
        ▼
  [Express API — :5000/api]
        │
        ├─ Helmet              (security headers on every response)
        ├─ CORS                (origin whitelist from FRONTEND_URL env)
        ├─ Global rate limiter (500 req / 15 min per IP)
        ├─ Request context     (X-Request-Id injected into every request)
        ├─ Route-level limiters (auth: 20/15 min, upload: 200/hr, share: 50/hr)
        ├─ authenticate        → validates JWT, attaches req.user
        ├─ authorizeAdmin      → role guard for /admin routes
        │
        ├─ Controller → validates input → calls Prisma ORM
        │                                       │
        │                                  PostgreSQL 15
        │
        ├─ Audit log written   (fire-and-forget, never blocks response)
        ├─ API usage recorded  (endpoint + duration + status code)
        │
        └─ JSON response  /  AppError → centralised error handler
```

### Authentication Flow

1. **Register** — user submits email + password. Password hashed with bcryptjs. An email verification token (random bytes → SHA-256) is generated and emailed.
2. **Verify email** — user clicks link; token compared against hash in DB; `isEmailVerified` flipped to `true`.
3. **Login** — credentials validated; two JWTs issued: short-lived **access token** (default `15m`) and long-lived **refresh token** (default `7d`). Both returned as JSON **and** set as `httpOnly` cookies.
4. **Authenticated requests** — `authenticate` middleware reads token from `Authorization: Bearer …` header or the access-token cookie.
5. **Token refresh** — client calls `POST /api/auth/refresh-token`; refresh token validated against DB; new access token returned.
6. **Logout** — refresh token cleared from DB; cookie deleted.
7. **Password reset** — user requests reset; time-limited token emailed; `POST /api/auth/reset-password` validates and updates hash.

### Subscription Enforcement

Every folder/file operation passes through `subscriptionEnforcer.ts` before touching the database:

```
User action (create folder / upload file)
        │
        ▼
  subscriptionEnforcer.ts
        │
        ├─ Is user ADMIN?       → bypass all checks ✓
        │
        ├─ Has active package?  → no package = 403 "Subscribe first"
        │
        ├─ Folder checks
        │     ├─ total folder count < maxFolders?
        │     └─ nesting depth  < maxNestingLevel?
        │
        └─ File checks
              ├─ file type  in  allowedFileTypes?
              ├─ file size  ≤   maxFileSize (MB)?
              ├─ total file count < totalFileLimit?
              └─ files in this folder < filesPerFolder?
```

Switching plans takes effect immediately — existing data is kept, new limits apply from the next action.

### Organization Model

Users can create organizations and invite members. Each org has roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`. Organizations own their own folders and files independently of personal storage. Billing (invoices + payments) is scoped per organization.

### Audit & Observability

- Every significant action (login, upload, delete, share, org changes, subscription changes, etc.) writes an `AuditLog` row with IP address, user agent, and action-specific metadata.
- Every authenticated API call writes an `ApiUsage` row (endpoint, method, status code, duration in ms) for analytics and quota auditing.
- Structured JSON logs via pino at configurable `LOG_LEVEL`.
- Three health endpoints for container orchestration: `/api/health`, `/api/health/live`, `/api/health/ready`.

### Startup Lifecycle

```
npm start
  │
  ├─ 1. prisma migrate deploy   → apply all pending migrations
  ├─ 2. prisma.$connect()       → verify database is reachable
  ├─ 3. seedDatabase()          → create admin + users + packages if absent (idempotent)
  └─ 4. app.listen(PORT)        → begin accepting requests
```

SIGINT / SIGTERM → graceful `prisma.$disconnect()` → process exits cleanly.

---

## Default Accounts (seeded automatically)

| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@saasfilemanager.com | Admin@123 |
| User  | user1@saasfilemanager.com | User1@123 |
| User  | user2@saasfilemanager.com | User2@123 |

---

## Tech Stack

| Layer             | Technology                                       |
|-------------------|--------------------------------------------------|
| Runtime           | Node.js 22                                       |
| Framework         | Express 5                                        |
| Language          | TypeScript 5                                     |
| ORM               | Prisma 7                                         |
| Database          | PostgreSQL 15                                    |
| Auth              | JWT — access token (15 m) + refresh token (7 d)  |
| File upload       | Multer (disk storage, 600 MB hard cap per file)  |
| Email             | Nodemailer (SMTP)                                |
| Passwords         | bcryptjs                                         |
| Env validation    | Zod (server refuses to start on bad config)      |
| Rate limiting     | express-rate-limit (global + per-route)          |
| Security headers  | Helmet                                           |
| Logging           | pino + pino-pretty                               |
| Compression       | compression (gzip)                               |
| Deployment        | Render                                           |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma            # Full data model (19 models, 5 enums)
│   ├── seed.ts                  # Seed runner (admin + users + packages)
│   └── migrations/              # Applied migration SQL history
│
└── src/
    ├── app.ts                   # Express setup — Helmet, CORS, middleware, routes
    ├── server.ts                # Entry point — migrate → seed → listen
    ├── seed.ts                  # Idempotent seeder
    │
    ├── config/
    │   ├── database.ts          # Prisma client (SSL-aware for production)
    │   └── env.ts               # Zod-validated typed environment
    │
    ├── common/
    │   ├── middleware/
    │   │   ├── auth.ts          # authenticate + authorizeAdmin guards
    │   │   ├── apiUsage.ts      # Fire-and-forget API call recorder
    │   │   ├── errorHandler.ts  # AppError class + Express error handler
    │   │   ├── rateLimiter.ts   # global / auth / upload / share limiters
    │   │   ├── requestContext.ts # X-Request-Id injection
    │   │   └── validate.ts      # express-validator result checker
    │   └── utils/
    │       ├── auditLog.ts      # createAuditLog helper
    │       ├── authSession.ts   # Token extraction (header + cookie)
    │       ├── crypto.ts        # Random bytes + SHA-256 hash
    │       ├── email.ts         # Nodemailer send wrappers
    │       ├── jwt.ts           # Token sign + verify
    │       ├── logger.ts        # pino instance
    │       ├── storage.ts       # Local file path helpers
    │       └── subscriptionEnforcer.ts  # Business rule engine
    │
    ├── modules/
    │   ├── auth/                # Register, login, verify, reset, refresh, logout
    │   ├── admin/               # Packages CRUD, user management, stats, audit logs, storage providers
    │   ├── users/               # Subscription, folders, files, profile, password
    │   ├── files/               # Download, share links, trash, search, tags, notifications
    │   ├── organizations/       # Org CRUD + member management
    │   ├── billing/             # Invoices + payments per org
    │   └── system/              # Health probes
    │
    └── routes/
        └── index.ts             # Route aggregator
```

---

## Data Model

| Model                | Purpose                                                       |
|----------------------|---------------------------------------------------------------|
| `User`               | Accounts, email verification, password reset, storage quota  |
| `Organization`       | Multi-user workspaces with ownership                          |
| `OrganizationMember` | User ↔ Org join with role (OWNER / ADMIN / MEMBER / VIEWER)  |
| `SubscriptionPackage`| Plans defining folder/file/storage limits                     |
| `SubscriptionHistory`| Immutable log of every plan change per user                   |
| `StorageProvider`    | Pluggable backends (local / S3 / GCS / Azure)                 |
| `Folder`             | Hierarchical folders with soft-delete and path tracking       |
| `File`               | Uploaded files with metadata, checksum, download counter      |
| `FileVersion`        | Version history per file                                      |
| `ShareLink`          | Time-limited / use-limited / password-protected public links  |
| `Tag`                | User-defined colour tags                                      |
| `FileTag`            | File ↔ Tag many-to-many join                                  |
| `AuditLog`           | Tamper-evident action log with IP + user agent                |
| `Notification`       | In-app notifications per user                                 |
| `Invoice`            | Per-organization billing records                              |
| `Payment`            | Payments recorded against invoices                            |
| `ApiUsage`           | Per-call analytics (endpoint, duration, status code)          |
| `FileActivity`       | File-level activity feed                                      |
| `SearchIndex`        | Full-text search metadata per file                            |

---

## API Reference

All routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Path                     | Auth | Description                               |
|--------|--------------------------|------|-------------------------------------------|
| POST   | `/register`              | No   | Register; sends email verification link   |
| POST   | `/login`                 | No   | Login; returns access + refresh JWT pair  |
| GET    | `/verify-email?token=`   | No   | Verify email with token from email link   |
| POST   | `/forgot-password`       | No   | Send password-reset email                 |
| POST   | `/reset-password?token=` | No   | Reset password with token                 |
| POST   | `/refresh-token`         | No   | Issue new access token via refresh token  |
| GET    | `/profile`               | JWT  | Get current user profile + active package |
| POST   | `/logout`                | JWT  | Revoke refresh token + clear cookies      |

> `/register`, `/login`, `/forgot-password`, `/reset-password` — rate-limited to **20 req / 15 min** per IP (failed attempts only).

---

### Admin — `/api/admin` *(Admin JWT required for all)*

#### Packages
| Method | Path            | Description           |
|--------|-----------------|-----------------------|
| GET    | `/packages`     | List all packages     |
| GET    | `/packages/:id` | Get single package    |
| POST   | `/packages`     | Create package        |
| PUT    | `/packages/:id` | Update package        |
| DELETE | `/packages/:id` | Delete package        |

#### Users
| Method | Path          | Description                              |
|--------|---------------|------------------------------------------|
| GET    | `/users`      | List all users (paginated)               |
| GET    | `/users/:id`  | Get single user                          |
| PUT    | `/users/:id`  | Update user (role, active status, etc.)  |
| DELETE | `/users/:id`  | Soft-delete user                         |

#### Analytics & Logs
| Method | Path          | Description                                |
|--------|---------------|--------------------------------------------|
| GET    | `/stats`      | Platform stats (users, files, orgs, etc.)  |
| GET    | `/audit-logs` | Paginated audit log with filters           |

#### Storage Providers
| Method | Path                 | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/storage-providers` | List configured providers    |
| POST   | `/storage-providers` | Register new storage backend |

---

### User — `/api/user` *(JWT required)*

#### Profile & Account
| Method | Path        | Description                        |
|--------|-------------|------------------------------------|
| PATCH  | `/profile`  | Update first name / last name      |
| PUT    | `/password` | Change password                    |
| GET    | `/storage`  | Storage usage and quota info       |

#### Subscriptions
| Method | Path                    | Description                           |
|--------|-------------------------|---------------------------------------|
| POST   | `/subscribe`            | Subscribe to a package                |
| POST   | `/unsubscribe`          | Cancel active subscription            |
| GET    | `/subscription-history` | Full history with start/end dates     |
| GET    | `/subscription-status`  | Current limits and remaining quota    |

#### Folders
| Method | Path                  | Description                             |
|--------|-----------------------|-----------------------------------------|
| POST   | `/folders`            | Create root folder                      |
| POST   | `/folders/sub`        | Create sub-folder under a parent        |
| GET    | `/folders`            | List all folders (tree-friendly)        |
| DELETE | `/folders/:id`        | Soft-delete folder (moves to trash)     |
| PATCH  | `/folders/:id/rename` | Rename folder                           |
| PATCH  | `/folders/:id/move`   | Move folder to a new parent             |

#### Files
| Method | Path                      | Description                                |
|--------|---------------------------|--------------------------------------------|
| POST   | `/files/upload`           | Upload file (multipart/form-data)          |
| GET    | `/files/folder/:folderId` | List files in a specific folder            |
| GET    | `/files/:id/download`     | Download file (increments downloadCount)   |
| PATCH  | `/files/:id/rename`       | Rename file                                |
| PATCH  | `/files/:id/move`         | Move file to a different folder            |
| DELETE | `/files/:id`              | Soft-delete file (moves to trash)          |

> Uploads rate-limited to **200 req / hour** per IP. Hard file size cap: **600 MB**.

#### File Sharing
| Method | Path                             | Description                                             |
|--------|----------------------------------|---------------------------------------------------------|
| POST   | `/files/:id/share`               | Create share link (expiry, max-uses, password optional) |
| GET    | `/files/:id/share-links`         | List all active share links for a file                  |
| DELETE | `/files/:id/share-links/:linkId` | Revoke a share link                                     |

> Share link creation rate-limited to **50 req / hour** per IP.

#### File Tags
| Method | Path                     | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/tags`                  | List user's tags               |
| POST   | `/tags`                  | Create a tag (name + colour)   |
| DELETE | `/tags/:id`              | Delete a tag                   |
| POST   | `/files/:id/tags`        | Attach tag to a file           |
| DELETE | `/files/:id/tags/:tagId` | Detach tag from a file         |

#### Trash
| Method | Path                       | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/trash`                   | List soft-deleted folders and files      |
| POST   | `/trash/restore/:type/:id` | Restore a folder or file from trash      |
| DELETE | `/trash`                   | Permanently delete everything in trash   |

#### Search
| Method | Path      | Description                                         |
|--------|-----------|-----------------------------------------------------|
| GET    | `/search` | Search files and folders by name / type             |

#### Notifications
| Method | Path                       | Description                         |
|--------|----------------------------|-------------------------------------|
| GET    | `/notifications`           | List user notifications             |
| PATCH  | `/notifications/:id/read`  | Mark one notification as read       |
| PATCH  | `/notifications/read-all`  | Mark all notifications as read      |
| DELETE | `/notifications/:id`       | Delete a notification               |

---

### Organizations — `/api/organizations` *(JWT required)*

| Method | Path                      | Description                               |
|--------|---------------------------|-------------------------------------------|
| POST   | `/`                       | Create organization                       |
| GET    | `/`                       | List organizations user is a member of   |
| GET    | `/:id`                    | Get organization details                  |
| PATCH  | `/:id`                    | Update name / slug                        |
| DELETE | `/:id`                    | Delete organization (owner only)          |
| GET    | `/:id/members`            | List members with roles                   |
| POST   | `/:id/members`            | Add member by user ID                     |
| PATCH  | `/:id/members/:memberId`  | Update member role                        |
| DELETE | `/:id/members/:memberId`  | Remove member                             |

---

### Billing — `/api/organizations/:orgId/billing` *(JWT required)*

| Method | Path                              | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | `/invoices`                       | List organization invoices       |
| GET    | `/invoices/:invoiceId`            | Get invoice detail               |
| POST   | `/invoices`                       | Create invoice                   |
| PATCH  | `/invoices/:invoiceId/status`     | Update invoice status            |
| GET    | `/invoices/:invoiceId/payments`   | List payments on an invoice      |
| POST   | `/invoices/:invoiceId/payments`   | Record a payment                 |

---

### Public (no auth required)

| Method | Path                      | Description                                      |
|--------|---------------------------|--------------------------------------------------|
| GET    | `/api/packages`           | Public list of all active subscription packages  |
| GET    | `/api/files/share/:token` | Access file via share link token                 |
| GET    | `/api/health`             | Aggregated API + DB health check                 |
| GET    | `/api/health/live`        | Liveness probe (200 if process is up)            |
| GET    | `/api/health/ready`       | Readiness probe (200 only if DB is reachable)    |

---

## Full Feature List

### Authentication & Security
- JWT dual-channel: `Authorization: Bearer` header **and** `httpOnly` cookie
- Refresh token stored in DB; revoked on logout; rotated on each refresh call
- Email verification — SHA-256 hashed token, 24-hour expiry
- Password reset — time-limited single-use email token
- bcryptjs password hashing (cost factor 10)
- Helmet security headers on every response
- CORS restricted to explicit `FRONTEND_URL` whitelist (comma-separated, validated as HTTP/HTTPS URLs)
- Zod env validation — server refuses to start with missing or invalid config

### Rate Limiting

| Scope                        | Window  | Limit  |
|------------------------------|---------|--------|
| Global (all `/api` routes)   | 15 min  | 500 / IP |
| Auth endpoints (failed only) | 15 min  | 20 / IP  |
| File uploads                 | 1 hour  | 200 / IP |
| Share link creation          | 1 hour  | 50 / IP  |

### Subscription Plans & Enforcement
- Plans defined by: `maxFolders`, `maxNestingLevel`, `allowedFileTypes`, `maxFileSize` (MB), `totalFileLimit`, `filesPerFolder`, `storageLimit` (bytes)
- Supported file types: `IMAGE`, `VIDEO`, `PDF`, `AUDIO`, `OTHER`
- Every folder creation checks count and nesting depth
- Every file upload checks type, size, total count, and per-folder count
- Admin users bypass all checks server-side
- Plan switching is instant — no data deleted, new limits applied immediately
- Full subscription history with start/end timestamps per user

### File Management
- Upload up to 600 MB per file (Multer disk storage, configurable destination)
- Soft-delete to trash (recoverable); permanent delete via empty trash
- File download with `downloadCount` tracking
- Rename and move files across folders
- File version history model (`FileVersion` table)
- Checksum stored per file for integrity verification

### File Sharing
- Generate share links with optional: expiry date, max-use limit, password protection
- Public token-based access via `/api/files/share/:token` (no login required)
- Revoke individual share links
- Use count tracked on every access

### File Tags
- Create custom tags with name and hex colour
- Attach multiple tags to a file; detach tags individually
- Tag CRUD (list, create, delete)

### Search
- Full-text search across files and folders by name / type via `GET /api/user/search`
- `SearchIndex` model provides metadata for future indexed search

### Trash & Recovery
- Soft-delete sets `isDeleted = true` and records `deletedAt`
- Restore individual folders or files from trash
- Empty trash permanently deletes all soft-deleted items

### Notifications
- In-app notification system per user
- Mark one or all notifications as read
- Delete individual notifications

### Organizations
- Create workspaces with a unique slug
- Member roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- Org-scoped folders and files (separate from personal storage)
- Owner-only deletion of the organization

### Billing (per Organization)
- Create invoices with amount and metadata
- Update invoice status (`PENDING` / `PAID` / `CANCELLED`)
- Record payments against invoices with amount and method
- Full payment history per invoice

### Storage Providers
- Admin registers backends: `local`, `s3`, `gcs`, `azure`
- Each file references its storage provider (multi-backend ready)

### Admin Panel
- Platform-wide stats: total users, files, organizations, storage consumed
- User management: list, view, update role/active status, soft-delete
- Subscription package CRUD with all limits
- Storage provider registration
- Paginated, filterable audit log viewer

### Observability
- `AuditLog` — every important action recorded with IP, user agent, and metadata (25+ audit actions)
- `ApiUsage` — every authenticated call recorded (endpoint, method, status, duration ms)
- Three health endpoints: `/health` (full), `/health/live` (liveness), `/health/ready` (readiness)
- pino structured JSON logging, configurable level

---

## Local Development

### Prerequisites
- Node.js 22+
- Docker (for local PostgreSQL) **or** an existing PostgreSQL instance

```bash
# 1. Clone repo
git clone https://github.com/Hacnine/FileForge.git
cd FileForge/backend

# 2. Install dependencies
npm install

# 3. Start PostgreSQL via Docker
docker compose up -d
# Default: postgres on port 5434

# 4. Configure environment
cp .env.example .env   # fill in values (see table below)

# 5. Start dev server (migrations + seed run automatically)
npm run dev
# → http://localhost:5000/api

# 6. Run tests
npm run test:run

# 7. Production build check
npm run build
```

### Environment Variables

| Variable                    | Required | Default                          | Description                                            |
|-----------------------------|----------|----------------------------------|--------------------------------------------------------|
| `DATABASE_URL`              | ✅       | —                                | PostgreSQL connection string                           |
| `JWT_SECRET`                | ✅       | —                                | Min 32-char secret for access tokens                   |
| `JWT_REFRESH_SECRET`        | ✅       | —                                | Min 32-char secret for refresh tokens                  |
| `PORT`                      | No       | `5000`                           | Server listen port                                     |
| `NODE_ENV`                  | No       | `development`                    | `development` / `production` / `test`                  |
| `APP_NAME`                  | No       | `saas-file-management-backend`   | Service name in logs and health probes                 |
| `JWT_EXPIRES_IN`            | No       | `15m`                            | Access token TTL                                       |
| `JWT_REFRESH_EXPIRES_IN`    | No       | `7d`                             | Refresh token TTL                                      |
| `FRONTEND_URL`              | No       | `http://localhost:3000`          | CORS allowed origins (comma-separated, validated URLs) |
| `SMTP_HOST`                 | No       | `smtp.gmail.com`                 | SMTP server host                                       |
| `SMTP_PORT`                 | No       | `587`                            | SMTP server port                                       |
| `SMTP_USER`                 | No       | —                                | SMTP username / email address                          |
| `SMTP_PASS`                 | No       | —                                | SMTP password or app password                          |
| `ACCESS_TOKEN_COOKIE_NAME`  | No       | `access_token`                   | Cookie name for access token                           |
| `REFRESH_TOKEN_COOKIE_NAME` | No       | `refresh_token`                  | Cookie name for refresh token                          |
| `COOKIE_DOMAIN`             | No       | —                                | Cookie domain (e.g. `.example.com`)                    |
| `COOKIE_SAME_SITE`          | No       | —                                | `lax` / `strict` / `none`                              |
| `LOG_LEVEL`                 | No       | `info`                           | `fatal` `error` `warn` `info` `debug` `trace`          |

> The server will **refuse to start** if `DATABASE_URL`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` are missing or too short — Zod validation runs at boot before any other code.

---

## Deployment (Render)

The project ships with `render.yaml` and `Procfile` for zero-config Render deployment.

```
Build command : npm install && npm run build
Start command : npm start   →  node dist/server.js
```

`node dist/server.js` runs migrations → seeds → starts the server automatically. No manual DB setup needed after the first deploy.
