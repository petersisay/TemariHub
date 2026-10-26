# TemariHub — System Architecture Specification

**Project:** TemariHub (ተማሪሀብ)  
**Architecture Style:** Modular Monolith (Express TypeScript REST API + React Vite SPA)  
**Target Environments:** Local Development, Automated CI/Test, Vercel (Frontend), Render (Backend), MongoDB Atlas (Database).  
**Production URLs:**
- **Frontend Web App:** [https://temari-hub.vercel.app](https://temari-hub.vercel.app)
- **Backend API Service:** [https://temarihub-api.onrender.com](https://temarihub-api.onrender.com)
- **GitHub Repository:** [https://github.com/petersisay/TemariHub](https://github.com/petersisay/TemariHub)

---

## 1. High-Level System Architecture

TemariHub adopts a **Modular Monolith** architecture. This avoids the operational complexity, network latency, and distributed-state pitfalls of microservices while maintaining strict domain modularity, clean code boundaries, and role-based encapsulation.

```
+---------------------------------------------------------------------------------------+
|                                     CLIENT (SPA)                                      |
|            React 18/19 + TypeScript + Vite + Tailwind CSS + TanStack Query            |
|                                                                                       |
|  +--------------------+  +--------------------+  +---------------------------------+  |
|  | Opportunity Feed   |  | Student Tracker    |  | Submitter Portal & Editor       |  |
|  | & Search Engine    |  | (7 Stages & Notes) |  | (/submit, /submission-status)   |  |
|  +--------------------+  +--------------------+  +---------------------------------+  |
|  +--------------------+  +--------------------+  +---------------------------------+  |
|  | Verification Queue |  | 12 Trusted Sources |  | User Profile & Custom Avatar    |  |
|  | & Admin Moderation |  | Monitoring Board   |  | (WebP Crop & @username)         |  |
|  +--------------------+  +--------------------+  +---------------------------------+  |
|  +---------------------------------------------------------------------------------+  |
|  |      Route Guards (ProtectedRoute.tsx) & Localization (i18n: English / Amharic) |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / JSON REST API
                                            | Google ID Token / HttpOnly Session Cookie
                                            v
+-------------------------------------------+-------------------------------------------+
|                                    BACKEND API                                        |
|                          Node.js + Express + TypeScript                               |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | Security Middleware (Helmet, CORS, Rate Limit, connect-mongo, Index Pruner)     |  |
|  +---------------------------------------------------------------------------------+  |
|                                                                                       |
|  +---------------------+  +---------------------+  +-------------------------------+  |
|  | Google Auth & Users |  | Opportunities       |  | Student Applications          |  |
|  | - google-auth-lib   |  | - Search & Filters  |  | - 7-Stage Tracker & Notes     |  |
|  | - Role Boundaries   |  | - Submitter Edits   |  | - Role Guards (Student Only)  |  |
|  +---------------------+  +---------------------+  +-------------------------------+  |
|  +---------------------+  +---------------------+  +-------------------------------+  |
|  | Verification Engine |  | 12 Trusted Sources  |  | Saved Bookmarks & Reports     |  |
|  | - Evidence Approval |  | - SourceMonitor (SSRF) - Compound Unique Indexes       |  |
|  | - Audit Trail       |  | - Ingest to PENDING |  | - User Flagging System        |  |
|  +---------------------+  +---------------------+  +-------------------------------+  |
|  +---------------------------------------------------------------------------------+  |
|  | Data Layer: Mongoose ODM, Schema Constraints, Self-Healing Database Index Hook  |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
                               +-------------------------+
                               | MongoDB (Atlas / Memory)|
                               +-------------------------+
```

---

## 2. Repository Structure

```
TemariHub/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated lint, typecheck, test workflow
├── docs/
│   ├── PRODUCT_REQUIREMENTS.md    # Product scope, personas & functional requirements
│   ├── ARCHITECTURE.md            # System topology & design decisions
│   ├── DATABASE_DESIGN.md         # Mongoose schemas, relationships & indexes
│   ├── API_DOCUMENTATION.md       # REST API endpoints, schemas & errors
│   ├── SECURITY.md                # Threat model, token verification & RBAC boundaries
│   ├── DEPLOYMENT_GUIDE.md        # Vercel & Render production operations guide
│   └── TESTING.md                 # Full 125-test suite coverage & execution strategy
├── client/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── temarihub-logo-badge.png
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/            # Button, Input, Modal, Badge, Card, Spinner, ProtectedRoute, Avatar
│   │   │   ├── layout/            # Navbar, Footer, Sidebar, PageContainer
│   │   │   ├── opportunities/     # OpportunityCard, FilterSidebar, SearchBar
│   │   │   ├── profile/           # ProfilePictureEditor (WebP cropping & preview)
│   │   │   ├── tracker/           # TrackerBoard, StatusBadge, NotesModal
│   │   │   └── admin/             # ModerationTable, AuditLogViewer, VerificationQueueTable
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # Google session, user profile, role state, logout
│   │   │   └── I18nContext.tsx    # Dynamic language switch (en/am) with persistent preference
│   │   ├── hooks/                 # Custom React hooks (useDebounce, useAuth, etc.)
│   │   ├── i18n/
│   │   │   ├── en.json            # English translations
│   │   │   └── am.json            # Amharic translations
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── OpportunitiesPage.tsx
│   │   │   ├── OpportunityDetailPage.tsx
│   │   │   ├── LoginPage.tsx      # Google Identity Services (GIS) one-click authentication
│   │   │   ├── ProfilePage.tsx    # Unified user profile, academic info, custom avatar
│   │   │   ├── SavedOpportunitiesPage.tsx
│   │   │   ├── ApplicationTrackerPage.tsx
│   │   │   ├── SubmitOpportunityPage.tsx    # New submission and existing submission editing
│   │   │   ├── SubmissionStatusPage.tsx    # Submitter tracking dashboard
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── VerificationQueuePage.tsx   # Admin evidence verification queue
│   │   │   ├── SourcesPage.tsx             # 12 Trusted Sources monitor & manual trigger
│   │   │   ├── ModerationQueuePage.tsx
│   │   │   ├── ReportsManagementPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   └── ErrorPage.tsx
│   │   ├── services/              # API services (auth, opportunity, profile, source, tracker)
│   │   ├── types/                 # Shared TypeScript interfaces
│   │   ├── utils/                 # Date formatting, EAT timezone helpers, validators
│   │   ├── App.tsx                # Route definitions & TanStack Query Provider
│   │   ├── main.tsx               # Root entry point
│   │   └── index.css              # Tailwind directives and custom animation keyframes
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # Mongoose connection & disconnect helpers
│   │   │   ├── env.ts             # Validated environment variables via Zod
│   │   │   └── universities.ts    # Seed list of Ethiopian universities & STEM disciplines
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # Session validation & role-based access control (RBAC)
│   │   │   ├── error.middleware.ts# Centralized error handler
│   │   │   ├── rateLimiter.ts     # Express rate limiter configuration
│   │   │   └── validate.ts        # Request body/query validator middleware
│   │   ├── modules/
│   │   │   ├── auth/              # Google ID token verification, session lifecycle
│   │   │   ├── profile/           # Unified profile endpoints, avatar upload & deletion
│   │   │   ├── users/             # User model, username constraints, academic preferences
│   │   │   ├── opportunities/     # Opportunity CRUD, submitter editing, search, verification
│   │   │   ├── sources/           # 12 Trusted Sources model, SourceMonitorService (SSRF-protected)
│   │   │   ├── applications/      # Student application tracker (7 stages) & notes
│   │   │   ├── saved/             # Saved bookmarks with compound unique constraints
│   │   │   ├── moderation/        # Admin approval, rejection, report review
│   │   │   └── audit/             # Administrative audit logging
│   │   ├── utils/                 # Logger, slug generator, username validator
│   │   ├── app.ts                 # Express application middleware pipeline assembly
│   │   └── server.ts              # HTTP listener entrypoint & self-healing index pruner
│   ├── tests/
│   │   ├── setup.ts               # MongoMemoryServer lifecycle & test environment
│   │   ├── auth.test.ts
│   │   ├── opportunities.test.ts
│   │   ├── tracker.test.ts
│   │   ├── profile.test.ts
│   │   ├── sources.test.ts
│   │   └── moderation.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── .gitignore
├── package.json                   # Root workspace orchestrator
└── README.md
```

---

## 3. Frontend Architecture & Design Decisions

### 3.1. Authentication & Route Protection (`ProtectedRoute.tsx`)
- **Google Identity Services (GIS):** Seamless one-click login. The Google SDK generates an ID token sent directly to `POST /api/v1/auth/google`.
- **Client Route Guards:** `ProtectedRoute.tsx` enforces strict role requirements before mounting pages:
  - `allowedRoles={['student']}`: `/tracker`, `/saved`, `/profile`
  - `allowedRoles={['submitter', 'admin']}`: `/submit`, `/submission-status`
  - `allowedRoles={['admin']}`: `/admin`, `/moderation`, `/admin/opportunities/verification-queue`, `/sources`, `/admin/reports`, `/admin/audit-logs`
- If an unauthenticated user attempts to access a protected route, they are redirected to `/login` with return-location state.
- If an authenticated user attempts to access a route outside their permitted role, they are redirected to an unauthorized error view or their designated home dashboard.

### 3.2. User Profile & Avatar Pipeline
- **Unique `@username` Validation:** Enforces 3 to 30 lowercase alphanumeric characters, checking for collision and blacklisted system words.
- **Client-Side Cropping & WebP Conversion:** Users crop their avatar to a 1:1 aspect ratio. The image is compressed into WebP format (< 5MB) before transmission to `POST /api/v1/profile/avatar`.
- **Graceful Fallback:** Removing a custom photo (`DELETE /api/v1/profile/avatar`) immediately falls back to the user's verified Google avatar (`photoUrl`) or an initials-based avatar.

### 3.3. Localization Architecture (English & Amharic)
- **Zero-Flicker Synchronous Loading:** Core dictionaries (`en.json`, `am.json`) are bundled directly with the application client.
- **State Persistence:** User language selection is persisted in `localStorage` and synchronized with user preferences on the backend.
- **Typography Support:** Tailored CSS font stacks render Fidel characters cleanly using *Noto Sans Ethiopic* with relaxed line-heights.

---

## 4. Backend Architecture & Domain Modularity

### 4.1. Request Processing Pipeline
1. **Security Headers:** Configured via `helmet()` with strict content security and referrer policies.
2. **CORS Validation:** Restricts cross-origin requests strictly to `CLIENT_URL` with credentials allowed.
3. **Rate Limiting:** Sliding-window rate limiters defend against abuse (`authLimiter`: 10 requests / 15 min; `apiLimiter`: 100 requests / 15 min).
4. **Session Authentication:** `express-session` with `connect-mongo` validates incoming session cookies, deserializing the user and attaching `req.user`.
5. **Self-Healing Startup:** During server startup, `server.ts` inspects MongoDB collections and safely drops obsolete indexes (such as `sessionTokenHash_1`) before accepting incoming traffic.
6. **Zod Validation Pipeline:** All route handlers validate parameters, query strings, and payloads against strongly-typed Zod schemas.
7. **Controller Layer:** Dispatches domain logic, triggers audit logs for mutating actions, and returns structured JSON responses.
8. **Centralized Error Handler:** Intercepts uncaught exceptions and operational errors, returning sanitized error messages without internal stack traces in production.

### 4.2. Trusted Source Monitoring & SSRF Protections
The `SourceMonitorService` automates candidate announcement discovery across 12 trusted institutions. To prevent Server-Side Request Forgery (SSRF):
- **Protocol Enforcement:** Restricts requests strictly to HTTPS.
- **DNS Resolution Check:** Resolves destination hostnames and blocks internal loopback (`127.0.0.1`, `localhost`), link-local, private network CIDR ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud instance metadata services (`169.254.169.254`).
- **Ingest Invariant:** Discovered items are inserted with `verificationStatus: 'PENDING_REVIEW'` and `publicationStatus: 'draft'`. Automated publishing is strictly prohibited.

---

## 5. Security & Access Control Matrix

| Feature / Resource | Public (Unauthenticated) | Student | Submitter (`petrossisay7164@...`) | Admin (`petrossisay1646@...`) |
|---|---|---|---|---|
| **View Verified Opportunities** | Read Only (`published` & `VERIFIED`) | Read Only | Read Only | Full Access |
| **View Unverified / Draft Listings** | Forbidden | Forbidden | Read (Own Listings Only) | Full Access |
| **Apply Now Workflow** | Redirect to Login | Allowed | **Forbidden** (Role Boundary) | **Forbidden** (Role Boundary) |
| **Application Tracker (7 Stages)** | Forbidden | Full Access (Own Only) | **Forbidden** | **Forbidden** |
| **Saved Bookmarks** | Forbidden | Full Access (Own Only) | Forbidden | Read (Own Only) |
| **Submit New Opportunity** | Forbidden | Forbidden | **Create** (Enters `PENDING_REVIEW`) | **Create** (Direct Publish) |
| **Edit Submitted Opportunity** | Forbidden | Forbidden | **Update** (Own listing only; resets to `draft`/`PENDING`) | Full Access |
| **Verification Queue** | Forbidden | Forbidden | Forbidden | **Full Access** (Verify with evidence) |
| **Trusted Source Monitoring** | Forbidden | Forbidden | Forbidden | **Full Access** (Trigger check, edit source) |
| **User Reports & Audit Logs** | Forbidden | Create Report | Create Report | **Full Access** (Resolve reports, view audit) |

---

## 6. Build, Testing & Deployment Topology

- **Frontend Hosting:** Vercel (`https://temari-hub.vercel.app`) with client-side SPA route rewrites configured via `vercel.json`.
- **Backend Hosting:** Render Web Service (`https://temarihub-api.onrender.com`) running Node.js in production mode (`npm start` -> `node dist/server.js`).
- **Database:** MongoDB Atlas M0/M10 cluster with TLS 1.3, encrypted storage, and restricted IP access.
- **Automated Verification:** 125 tests (109 backend + 16 frontend) verified via Vitest, Supertest, and React Testing Library before production releases.
