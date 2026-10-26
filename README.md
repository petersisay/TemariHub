# TemariHub (ተማሪሀብ)

<div align="center">
  <img src="client/public/temarihub-logo-badge.png" alt="TemariHub Brand Logo" width="120" height="120" />
  <h3>Discover opportunities. Build your future.</h3>
  <p><em>ዕድሎችን ያግኙ። የወደፊትዎን ይገንቡ።</em></p>

  [![CI Tests](https://img.shields.io/badge/tests-125%20passed-brightgreen.svg)](#-full-stack-implementation-status)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20Strict-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18%2F19-61dafb.svg)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://mongoosejs.com/)
  [![License](https://img.shields.io/badge/license-MIT-purple.svg)](./LICENSE)
</div>

---

**TemariHub** is a production-grade opportunity discovery and application tracking platform crafted specifically for Ethiopian university students in STEM and technology disciplines. It bridges the gap between fragmented information sources and ambitious students seeking verified internships, entry-level engineering roles, hackathons, fellowships, and scholarships across Ethiopia and global remote programs.

### 🌐 Live Production Deployments
- **Frontend Web Application:** [https://temari-hub.vercel.app](https://temari-hub.vercel.app)
- **Backend REST API:** [https://temarihub-api.onrender.com](https://temarihub-api.onrender.com)
- **GitHub Repository:** [https://github.com/petersisay/TemariHub](https://github.com/petersisay/TemariHub)

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

- **Centralized Opportunity Discovery:** Verified listings with direct official application links, original source links, deadlines, and eligibility requirements.
- **Trusted Source Monitoring (12 Institutions):** Continuous discovery across verified Ethiopian and international platforms (ASTU, AAU, DAAD, Mastercard Foundation, GSoC, MLH, UNICEF, UNDP, Safaricom, EAII, Ethiopian Airlines, Gebeya) with SSRF defenses. Discovered items enter `PENDING_REVIEW` & `draft`; never auto-published without admin review.
- **Google-Only One-Click Authentication:** Safe, streamlined authentication via Google Identity Services (GIS) with server-side ID token verification and HttpOnly session cookies.
- **Strict Three-Role System:** Rigorous permission boundaries separating **Students**, **Opportunity Submitters** (`petrossisay7164@gmail.com`), and **Platform Administrators** (`petrossisay1646@gmail.com`).
- **Student Application Tracker:** Monitor applications across 7 structured stages (*Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*) with private notes and deadline reminders.
- **Profile & Custom Avatar Management:** Unique `@username` validation, unified profile editing, and client-side square WebP image cropping with Google photo fallback.
- **Submitter Editing & Re-Verification:** Submitters can track and edit their listings; material modifications automatically trigger status resets to `draft` and `PENDING_REVIEW` for mandatory administrative re-verification.
- **Bilingual Interface:** Full dynamic English (default) and Amharic support with persistent preferences.

---

## 🏗️ Architecture & Technology Stack

- **Architecture:** Modular Monolith with separate `client/` and `server/` workspaces
- **Frontend (`client/`):** React 18/19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide React, Google Identity Services (GIS)
- **Backend (`server/`):** Node.js, Express, TypeScript, Mongoose ODM, Zod, connect-mongo, google-auth-library, Helmet, express-rate-limit
- **Database:** MongoDB Atlas (Production) / Persistent Local MongoDB (Development) / MongoMemoryServer (Automated Testing)
- **Security & Reliability:**
  - Google ID token cryptographic signature verification via `google-auth-library`
  - Server-side sessions with persistent `connect-mongo` session store
  - Secure `HttpOnly` session cookies (`SameSite: none` for cross-domain production, `Secure: true`)
  - Session regeneration after login (session fixation prevention) and invalidation on logout
  - Strict production session-secret validation: minimum 32 characters, rejection of development defaults & placeholders, fail-fast startup
  - Self-healing database startup routine that prunes obsolete indexes (such as `sessionTokenHash_1`)
  - Server-Side Request Forgery (SSRF) defense layer blocking loopback, private networks, and cloud metadata IPs
  - Role-based access control (`student`, `submitter`, `admin`) with ownership boundaries
- **Quality Assurance:** 125 automated tests across Vitest, Supertest, React Testing Library, and TypeScript strict compiler checks.

---

## 📖 Documentation Index

Complete specifications and architectural blueprints are available in the [`docs/`](./docs) directory:

1. [Product Requirements Document (PRD)](./docs/PRODUCT_REQUIREMENTS.md) — Product scope, personas, and functional requirements
2. [System Architecture Specification](./docs/ARCHITECTURE.md) — Modular monolith topology, Google auth, and route guards
3. [Database Schema & Data Models](./docs/DATABASE_DESIGN.md) — Mongoose schemas, relationships, indexes, and self-healing hooks
4. [REST API Documentation](./docs/API_DOCUMENTATION.md) — Comprehensive endpoints, schemas, headers, and error envelopes
5. [Security & Threat Model](./docs/SECURITY.md) — Cryptographic token verification, SSRF defense, and RBAC boundaries
6. [Testing & QA Strategy](./docs/TESTING.md) — Full 125-test suite breakdown and execution strategy
7. [Production Deployment & Operations Guide](./docs/DEPLOYMENT_GUIDE.md) — Vercel, Render, and MongoDB Atlas operations guide

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v20/v22)
- **npm:** v9+

### 2. Environment Configuration
Copy `.env.example` to `.env` at the root directory:
```bash
cp .env.example .env
```

| Variable | Default (Dev) | Production Requirement | Description |
|---|---|---|---|
| `PORT` | `5000` | Optional (`10000` on Render) | Backend API server listen port |
| `NODE_ENV` | `development` | `production` | Runtime environment (`development`, `production`, `test`) |
| `API_PREFIX` | `/api/v1` | Optional | Versioned REST API root prefix |
| `CLIENT_URL` | `http://localhost:5173` | **Required** (`https://temari-hub.vercel.app`) | Allowed CORS origin and cookie origin |
| `MONGODB_URI` | `mongodb://localhost:27017/temarihub` | **Required** | MongoDB connection string |
| `SESSION_SECRET` | *(Dev default)* | **Required (>=32 chars)** | Cryptographically secure secret for session signing |
| `SESSION_COOKIE_NAME` | `temarihub_sid` | Optional | Cookie name for session identifier |
| `SESSION_COOKIE_SAME_SITE` | `lax` | `none` (Production cross-origin) | SameSite cookie policy |
| `GOOGLE_CLIENT_ID` | *(None)* | **Required** | Google OAuth 2.0 Web Client ID |
| `ADMIN_EMAIL` | `petrossisay1646@gmail.com` | **Required** | Designated administrator email |
| `SUBMITTER_EMAIL` | `petrossisay7164@gmail.com` | **Required** | Designated opportunity submitter email |
| `ENABLE_SOURCE_MONITORING`| `true` | Optional | Enables automated discovery from 12 trusted sources |

Frontend build variables (`client/.env`):
| Variable | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | Backend API URL (use Render URL in production) |
| `VITE_GOOGLE_CLIENT_ID` | `xxxxxxxxxxxx.apps.googleusercontent.com` | Google OAuth Web Client ID matching backend |

---

## 💻 Available Scripts

| Command | Description |
|---|---|
| `npm run dev:client` | Start frontend Vite development server (`http://localhost:5173`) |
| `npm run dev:server` | Start backend Express development server (`http://localhost:5000/api/v1`) |
| `npm run build:client` | Type-check and build production frontend bundle (`client/dist`) |
| `npm run build:server` | Type-check and compile backend TypeScript (`server/dist`) |
| `npm test` | Run entire 125-test automated test suite across client and server |
| `npm run test:client` | Run frontend component and localization tests via Vitest |
| `npm run test:server` | Run backend integration and security test suite via Vitest & Supertest |
| `npm run typecheck:client` | Run TypeScript compiler checks on `client` |
| `npm run typecheck:server` | Run TypeScript compiler checks on `server` |

---

## 🔒 Implemented API Endpoints

### Authentication & Identity (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System health check (`status`, `uptime`, `timestamp`, `version`) |
| `POST` | `/api/v1/auth/google` | Public (Rate-limited, CSRF) | Google ID token sign-in, role resolution, session creation |
| `POST` | `/api/v1/auth/logout` | Authenticated (CSRF) | Invalidate server session, clear session cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve currently authenticated user payload |
| `POST` | `/api/v1/auth/register` | Public | Retired (Returns HTTP 403 Forbidden) |
| `POST` | `/api/v1/auth/login` | Public | Retired (Returns HTTP 403 Forbidden) |

### Profile & Avatar Management (`/api/v1/profile`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/profile/me` | Authenticated | Retrieve authenticated user profile, avatar, preferences |
| `PUT` | `/api/v1/profile/me` | Authenticated | Update user metadata, username, bio, and student academic info |
| `PUT` | `/api/v1/profile/preferences` | Authenticated | Update deadline alerts, review alerts, and language preference |
| `POST` | `/api/v1/profile/avatar` | Authenticated (Multipart) | Upload custom profile picture (WebP cropped, <= 5MB) |
| `DELETE` | `/api/v1/profile/avatar` | Authenticated | Remove custom avatar, restore Google photo or initial avatar |

### Opportunity Discovery & Submissions (`/api/v1/opportunities`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/opportunities` | Public | List published & verified opportunities with search and filters |
| `GET` | `/api/v1/opportunities/:idOrSlug` | Public / Owner / Admin | Get opportunity details (unpublished visible only to owner/admin) |
| `POST` | `/api/v1/opportunities/submit` | Submitter / Admin | Submit listing into review queue (draft status) |
| `PUT` | `/api/v1/opportunities/:id` | Submitter (Own) / Admin | Edit listing; material updates reset status to review queue |
| `GET` | `/api/v1/opportunities/my-submissions` | Submitter / Admin | List opportunities submitted by current user |
| `POST` | `/api/v1/opportunities/:id/report` | Authenticated | Submit community flag/report for broken link or scam |

### Saved Bookmarks (`/api/v1/saved`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/saved` | Student only | Retrieve all bookmarked opportunities populated with details |
| `POST` | `/api/v1/saved/:opportunityId` | Student only (CSRF) | Bookmark opportunity (idempotent duplicate prevention) |
| `DELETE` | `/api/v1/saved/:opportunityId` | Student only (CSRF) | Remove bookmark |

### Student Application Tracker (`/api/v1/tracker`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/tracker` | Student only | Retrieve tracked applications populated with opportunity details |
| `GET` | `/api/v1/tracker/stats` | Student only | Student dashboard metrics and upcoming deadline reminders |
| `POST` | `/api/v1/tracker` | Student only (CSRF) | Add opportunity to tracker across 7 stages with private notes |
| `PUT` | `/api/v1/tracker/:id` | Student (Owner only, CSRF) | Update stage, private notes, or applied date |
| `DELETE` | `/api/v1/tracker/:id` | Student (Owner only, CSRF) | Delete tracker entry |

### Trusted Source Monitoring (`/api/v1/sources`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/sources` | Public / Authenticated | List all 12 monitored sources with category and status |
| `POST` | `/api/v1/sources/:id/check` | Admin only (CSRF) | Trigger immediate SSRF-protected check against source |
| `POST` | `/api/v1/sources/check-all` | Admin only (CSRF) | Trigger background check across all active candidate sources |
| `GET` | `/api/v1/sources/health/stats` | Admin only | Aggregate source monitoring health statistics |

### Admin Moderation & Verification (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/opportunities/verification-queue`| Admin only | Verification queue of candidate opportunity listings |
| `POST` | `/api/v1/admin/opportunities/:id/verify` | Admin only (CSRF) | Verify opportunity with recorded evidence, publish to feed |
| `GET` | `/api/v1/admin/moderation/queue` | Admin only | Moderation queue of pending submissions |
| `PUT` | `/api/v1/admin/moderation/:id/decision` | Admin only (CSRF) | Approve or reject listing with reviewer feedback notes |
| `GET` | `/api/v1/admin/reports` | Admin only | Inspect community user reports |
| `PUT` | `/api/v1/admin/reports/:id/resolve` | Admin only (CSRF) | Resolve or dismiss report with resolution notes |
| `GET` | `/api/v1/admin/audit-logs` | Admin only | System transparency audit trail (actor, action, target) |
| `GET` | `/api/v1/admin/stats` | Admin only | Platform overview telemetry and moderation metrics |

---

## 📊 Full-Stack Implementation Status

- [x] **Data Architecture:** 10 Mongoose schemas created with indexes, unique constraints, and timestamps (`User`, `StudentProfile`, `Organization`, `Opportunity`, `TrustedSource`, `SavedOpportunity`, `ApplicationTracker`, `Notification`, `OpportunityReport`, `AuditLog`)
- [x] **Self-Healing Database:** Startup hook in `server.ts` safely inspects and drops obsolete indexes (such as `sessionTokenHash_1`)
- [x] **Google-Only Authentication:** Cryptographic ID token verification via `google-auth-library` and retirement of password authentication
- [x] **Strict 3-Role System:** Enforced roles for `student`, designated `submitter` (`petrossisay7164@gmail.com`), and designated `admin` (`petrossisay1646@gmail.com`)
- [x] **Trusted Source Monitoring:** 12 verified institutions monitored with SSRF defenses; discovered listings ingested in `PENDING_REVIEW` & `draft`
- [x] **Opportunity Verification Workflow:** Dedicated verification queue (`/admin/opportunities/verification-queue`) with recorded evidence
- [x] **Submitter Lifecycle & Editing:** Submitter editing via `PUT /api/v1/opportunities/:id` with automatic re-verification reset
- [x] **Student Management:** 7-stage application tracking with private notes and duplicate-protected bookmarks (`/saved`)
- [x] **User Profiles & Avatars:** Unique `@username` validation, unified profile editing, and client-side square WebP image cropping with Google photo fallback
- [x] **Bilingual Support:** Dynamic English (default) and Amharic UI with persistent preferences
- [x] **Automated Testing:** 125 total passing tests (109 backend integration/security tests across 12 suites + 16 frontend tests across 3 suites)

---

## 📜 License

MIT License. Designed and built for Ethiopian STEM students.
