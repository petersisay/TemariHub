# TemariHub (ተማሪሀብ)

<div align="center">
  <img src="client/public/temarihub-logo-badge.png" alt="TemariHub Brand Logo" width="120" height="120" />
  <h3>Discover opportunities. Build your future.</h3>
  <p><em>ዕድሎችን ያግኙ። የወደፊትዎን ይገንቡ።</em></p>

  [![CI Tests](https://img.shields.io/badge/tests-86%20passed-brightgreen.svg)](#-full-stack-mvp-implementation-status)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20Strict-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://mongoosejs.com/)
  [![License](https://img.shields.io/badge/license-MIT-purple.svg)](./LICENSE)
</div>

---

TemariHub is a full-stack opportunity discovery and application tracking platform crafted specifically for Ethiopian university students in STEM and technology disciplines. It bridges the gap between fragmented information sources and ambitious students seeking verified internships, entry-level engineering roles, hackathons, fellowships, and scholarships across Ethiopia and global remote programs.

---

## 🎨 Brand Identity & Motion Design

TemariHub features a modernized, production-grade visual identity and motion experience tailored for Ethiopian students and tech innovators:

- **Graduation-Cap "T" Emblem:** The official brand mark integrates the bold letter **T** with an academic graduation cap and tassel, symbolizing education, achievement, and career elevation. Used seamlessly across the transparent navbar, favicon suite (`.ico`, `.png`), and social cards.
- **Deep Navy & Electric-Blue Cosmos:** The hero visual foundation pairs high-resolution education-tech imagery (digital globe, glowing constellation nodes, academic cap) with dark vignette gradients to ensure maximum contrast and WCAG AAA typography readability.
- **Pure CSS Keyframe Animation System:**
  - **Flowing Wave Harmonics:** Dual-speed horizontal wave layers (`heroWaveSlow` 22s and `heroWaveFast` 14s) producing a dynamic fluid effect.
  - **Floating Luminous Constellations:** 9 staggered floating node particles with cyan pulses and warm amber highlights drifting smoothly across the viewport.
  - **Ambient Core Glow & Cap Float:** Subtle 5-second rhythmic glow breathing around the digital globe and graduation cap.
  - **Glassmorphic Search Bar:** Translucent frosted container with high-contrast text inputs, quick-filter badges, and glowing focus rings.
  - **Accessibility-First Motion:** All animations respect `prefers-reduced-motion: reduce`, ensuring an immediate graceful fallback for users with motion sensitivity.

---

## 🌟 Key Features

- **Centralized Opportunity Discovery:** Verified listings with direct application links, original source links, deadlines, and requirements.
- **Multifaceted Filtering:** Filter by category, academic degree level, field of study (Software Engineering, CS, Electrical, etc.), and location/work arrangement.
- **Student Application Tracker:** Monitor applications across 7 structured stages (*Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*) with private notes and deadline reminders.
- **Opportunity Bookmarks:** Quick save and unsave functionality with compound unique constraints.
- **Opportunity Submitter Portal:** Structured submission flow for recruiters, tech clubs, and universities with verification URLs.
- **Trust & Moderation:** Two-tier publishing workflow with admin moderation queue, expiry automation, user reporting, and audit logs.
- **Bilingual Interface:** Full dynamic English (default) and Amharic support with persistent preferences.

---

## 🏗️ Architecture & Technology Stack

- **Architecture:** Modular Monolith with separate `client/` and `server/` workspaces
- **Frontend (`client/`):** React 18/19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide React
- **Backend (`server/`):** Node.js, Express, TypeScript, Mongoose ODM, Zod, connect-mongo, bcryptjs, Helmet, express-rate-limit
- **Database:** MongoDB Atlas (Production) / Persistent Local MongoDB (Development) / MongoMemoryServer (Automated Testing)
- **Security:**
  - Password hashing via `bcryptjs` with 12 salt rounds
  - Server-side sessions with persistent `connect-mongo` session store
  - Secure `HttpOnly` session cookies (`SameSite: lax/strict`, `Secure` in production)
  - Session regeneration after login (session fixation prevention) and invalidation on logout
  - Strict production session-secret validation: minimum 32 characters, rejection of development defaults & placeholders, fail-fast startup
  - CSRF defense-in-depth: custom `X-Requested-With: XMLHttpRequest` header validation & strict production `Origin` header matching against `CLIENT_URL`
  - Rate limiting on authentication routes (10 attempts / 15 min) and general API routes
  - Role-based access control (`student`, `submitter`, `admin`) with ownership boundaries
  - Prevention of public administrator registration and refusal of automatic role escalation
- **Quality Assurance:** Vitest, React Testing Library, Supertest, TypeScript strict checking

---

## 📖 Documentation Index

Complete specifications and architectural blueprints are available in the [`docs/`](./docs) directory:

1. [Product Requirements Document (PRD)](./docs/PRODUCT_REQUIREMENTS.md)
2. [System Architecture Specification](./docs/ARCHITECTURE.md)
3. [Database Schema & Data Models](./docs/DATABASE_DESIGN.md)
4. [REST API Documentation](./docs/API_DOCUMENTATION.md)
5. [Security & Threat Model](./docs/SECURITY.md)
6. [Testing & QA Strategy](./docs/TESTING.md)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v22+)
- **npm:** v9+

### 2. Environment Configuration & Secret Strategy
TemariHub employs a **deterministic environment resolution strategy**. Environment variables are resolved consistently whether scripts are executed from the repository root (e.g. `npm run dev:server`, `npm run seed:admin`) or within workspace subdirectories (e.g. `cd server && npm run dev`).

The system resolves configuration candidates in order:
1. `<process.cwd()>/.env`
2. `<process.cwd()>/../.env` (when running inside `server/`)
3. `<process.cwd()>/server/.env`

Copy `.env.example` to `.env` at the root directory:
```bash
cp .env.example .env
```

> **Client vs Server Secrets Boundary:**  
> Frontend (`client/`) bundles only explicitly public variables prefixed with `VITE_` at build time. Sensitive backend configuration (`SESSION_SECRET`, `MONGODB_URI`, `INITIAL_ADMIN_*`) resides exclusively on the server and is never loaded into or exposed to browser bundles.

#### Cryptographically Secure Session Secrets
In **production**, `SESSION_SECRET` is strictly required and must be at least 32 characters. Production startup will **fail fast** with a clear error if the secret is missing, too short, or matches development defaults or known template placeholders. Secrets are **never logged**.

Generate a production session secret using one of these commands:
```bash
# Using OpenSSL:
openssl rand -hex 32

# Using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variable | Default (Dev) | Production Requirement | Description |
|---|---|---|---|
| `PORT` | `5000` | Optional | Backend API server listen port |
| `NODE_ENV` | `development` | `production` | Runtime environment (`development`, `production`, `test`) |
| `API_PREFIX` | `/api/v1` | Optional | Versioned REST API root prefix |
| `CLIENT_URL` | `http://localhost:5173` | **Required** | Allowed CORS origin and cookie origin |
| `MONGODB_URI` | `mongodb://localhost:27017/temarihub` | **Required** | Persistent MongoDB connection string |
| `SESSION_SECRET` | *(Dev default permitted only in dev)* | **Required (>=32 chars)** | Cryptographically secure secret for session signing |
| `SESSION_COOKIE_NAME` | `temarihub_sid` | Optional | Cookie name for session identifier |
| `SESSION_MAX_AGE_MS` | `604800000` | Optional | Session cookie max age (7 days in ms) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Optional | Rate limiter window (15 minutes in ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Optional | Max requests per IP within the rate limit window |
| `INITIAL_ADMIN_EMAIL` | *(None)* | CLI-only | Email for initial administrator provisioning |
| `INITIAL_ADMIN_PASSWORD` | *(None)* | CLI-only (>=8 chars) | Password for initial administrator provisioning |
| `INITIAL_ADMIN_NAME` | `TemariHub Administrator` | CLI-only | Name for initial administrator |

### 3. Database Setup
- **Automated Tests:** Vitest automatically spins up an isolated `mongodb-memory-server` in-memory database instance.
- **Local Development:** Run a local MongoDB instance (`mongodb://localhost:27017/temarihub`) or configure a dedicated development Atlas cluster URI in `.env`.
- **Production:** A MongoDB Atlas cluster with TLS and IP access rules.

### 4. Administrator Provisioning (CLI Bootstrap)
Public registration strictly rejects requests attempting to register as `admin`. Provisioning the initial administrator account is performed exclusively via the protected CLI script:
```bash
INITIAL_ADMIN_EMAIL=admin@temarihub.et INITIAL_ADMIN_PASSWORD=SecurePassword123! npm run seed:admin
```

#### Provisioning Rules & Role Escalation Refusal Policy:
1. **Schema Integrity:** Uses the canonical User schema `name` field (not unsupported `fullName`).
2. **Idempotent:** If the configured email already belongs to an administrator, the script exits safely without creating duplicates.
3. **Refusal of Automatic Role Escalation:** If the configured email belongs to an existing `student` or `submitter` account, the script **strictly refuses automatic promotion**. Role escalation requires an explicit, separately authorized administrative procedure to prevent accidental account takeover or unauthorized privilege escalation.
4. **Audit Logging:** Every successful administrator creation records an immutable audit log entry (`action: 'admin_provisioned'`, `targetType: 'user'`).
5. **Credential Confidentiality:** Passwords and secrets are never printed or logged.
6. **Connection Handling:** Database disconnection and process termination are handled cleanly on both success and error.

---

## 💻 Available Scripts

From the repository root:

| Command | Description |
|---|---|
| `npm run dev:client` | Start frontend Vite development server (`http://localhost:5173`) |
| `npm run dev:server` | Start backend Express development server (`http://localhost:5000/api/v1`) |
| `npm run build:client` | Type-check and build production frontend bundle (`client/dist`) |
| `npm run build:server` | Type-check and compile backend TypeScript (`server/dist`) |
| `npm run test:client` | Run frontend component and localization tests via Vitest |
| `npm run test:server` | Run backend integration and security test suite via Vitest & Supertest |
| `npm run typecheck:client` | Run TypeScript compiler checks on `client` |
| `npm run typecheck:server` | Run TypeScript compiler checks on `server` |
| `npm run seed:admin` | Run protected administrator account bootstrap script |
| `npm run seed:opportunities` | Populate database with realistic verified Ethiopian STEM opportunities |

---

## 🔒 Implemented API Endpoints (Full-Stack MVP)

### Authentication & Identity (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System health check (`status`, `uptime`, `timestamp`, `version`) |
| `POST` | `/api/v1/auth/register` | Public (Rate-limited, CSRF) | Register as `student` or `submitter` (admin registration denied) |
| `POST` | `/api/v1/auth/login` | Public (Rate-limited, CSRF) | Authenticate user, regenerate session, set HttpOnly cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated (CSRF) | Destroy server session, clear session cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve currently authenticated user payload |

### Student Profile (`/api/v1/profile`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/profile/me` | Authenticated (Student) | Get authenticated student's academic profile |
| `PUT` | `/api/v1/profile/me` | Authenticated (Student) | Update authenticated student's academic profile |
| `GET` | `/api/v1/profile/:userId` | Authenticated (Owner/Admin) | View student profile (cross-user access denied unless admin) |

### Opportunity Discovery & Submission (`/api/v1/opportunities`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/opportunities` | Public | List published & approved opportunities with search, multi-filters, and pagination |
| `GET` | `/api/v1/opportunities/:idOrSlug` | Public / Owner / Admin | Get opportunity details (unpublished listings accessible only to owner/admin) |
| `POST` | `/api/v1/opportunities/submit` | Authenticated (Submitter/Admin) | Submit listing for moderation (or publish directly if admin) |
| `GET` | `/api/v1/opportunities/my-submissions` | Authenticated (Submitter/Admin) | List opportunities submitted by the current user |
| `POST` | `/api/v1/opportunities/:id/report` | Authenticated | Submit community flag/report for broken links, scams, or expired info |

### Saved Bookmarks (`/api/v1/saved-opportunities`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/saved-opportunities` | Authenticated (Student) | Retrieve all bookmarked opportunities populated with details |
| `POST` | `/api/v1/saved-opportunities/:opportunityId` | Authenticated (Student, CSRF) | Bookmark opportunity (idempotent, prevents duplicate saves) |
| `DELETE` | `/api/v1/saved-opportunities/:opportunityId` | Authenticated (Student, CSRF) | Remove bookmark and decrement savesCount |
| `GET` | `/api/v1/saved-opportunities/:opportunityId/status` | Authenticated (Student) | Check whether opportunity is bookmarked by current student |

### Application Tracker (`/api/v1/tracker`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/tracker` | Authenticated (Student) | Retrieve tracked applications populated with opportunity details |
| `GET` | `/api/v1/tracker/stats` | Authenticated (Student) | Student dashboard metrics and upcoming deadline reminders |
| `POST` | `/api/v1/tracker` | Authenticated (Student, CSRF) | Add opportunity to tracker across 7 stages with private notes |
| `PUT` | `/api/v1/tracker/:trackerId` | Authenticated (Owner only, CSRF) | Update status stage, private notes, or applied date (Strict ownership) |
| `DELETE` | `/api/v1/tracker/:trackerId` | Authenticated (Owner only, CSRF) | Delete tracker entry (Strict ownership) |

### Administrative Moderation & Governance (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/moderation/queue` | Authenticated (Admin only) | Moderation queue of pending opportunity submissions |
| `PUT` | `/api/v1/admin/moderation/:id/decision` | Authenticated (Admin only, CSRF) | Approve or reject listing with reviewer feedback notes |
| `GET` | `/api/v1/admin/reports` | Authenticated (Admin only) | Inspect community user reports |
| `PUT` | `/api/v1/admin/reports/:id/resolve` | Authenticated (Admin only, CSRF) | Mark report as resolved or dismissed with resolution notes |
| `GET` | `/api/v1/admin/audit-logs` | Authenticated (Admin only) | System transparency audit trail (target, actor, action, timestamp) |
| `GET` | `/api/v1/admin/stats` | Authenticated (Admin only) | Platform overview telemetry and moderation queue counts |

---

## 📊 Full-Stack MVP Implementation Status

- [x] **Data Architecture:** All 9 Mongoose schemas created with indexes, unique constraints, and timestamps (`User`, `StudentProfile`, `Organization`, `Opportunity`, `SavedOpportunity`, `ApplicationTracker`, `Notification`, `OpportunityReport`, `AuditLog`)
- [x] **Security Foundation:** Server-side sessions with persistent `connect-mongo` store, strict production secret validation (>=32 chars, fail-fast), Helmet headers, CORS allowlist, CSRF protection, production Origin header verification, login rate limiting
- [x] **Opportunity Discovery:** Real backend search, faceted filtering (categories, locations, STEM disciplines, education levels, work arrangements), sorting, pagination, and protection against unpublished/pending listing leakage
- [x] **Student Opportunity Management:** Saved bookmarks with compound unique constraints, 7-stage application tracking with private notes, and student dashboard deadline metrics
- [x] **Moderation Workflow:** Submitter portal with required verification URLs, admin moderation queue, approve/reject decisions with reviewer feedback, community reporting, and append-only audit trail
- [x] **Role Authorization & Isolation:** Server-side ownership enforcement on all private resources; strict rejection of automatic admin role promotion
- [x] **Frontend API Integration:** Real backend communication with credentials, CSRF headers, loading/error states, and offline resilience
- [x] **Bilingual Support:** Dynamic English (default) and Amharic UI with persistent language switching
- [x] **Automated Testing:** 72 backend integration/security tests and 14 frontend tests passing (86 total automated tests)

---

## 🖥️ Running and Reviewing Locally

To inspect the live running frontend and backend in your browser:

1. **Start MongoDB:**
   ```bash
   mongod --dbpath <path-to-db> --port 27017
   ```
2. **Start Backend Server (Port 5000):**
   ```bash
   npm run dev:server
   ```
3. **Start Frontend Dev Server (Port 5173):**
   ```bash
   npm run dev:client
   ```
4. **Open Browser:**
   - Platform UI: [`http://localhost:5173`](http://localhost:5173)
   - API Health: [`http://localhost:5000/api/v1/health`](http://localhost:5000/api/v1/health)

Demo Accounts for instant verification:
- **Student User:** `nahom.tadesse@aau.edu.et` / `StudentPassword123!`
- **Administrator:** `admin@temarihub.et` / `AdminPass123!`

---

## 📜 License

MIT License. Designed and built for Ethiopian STEM students.

