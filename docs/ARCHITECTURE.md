# TemariHub — System Architecture Specification

**Project:** TemariHub  
**Architecture Style:** Modular Monolith (Single-service Express REST API + React SPA)  
**Target Environments:** Local Development, Automated CI/Test, Vercel (Frontend), Render (Backend), MongoDB Atlas (Database).  

---

## 1. High-Level System Architecture

TemariHub adopts a **Modular Monolith** architecture. This avoids the operational complexity, network latency, and distributed-state pitfalls of microservices while maintaining strict code boundaries and domain modularity for future separation if needed.

```
+-------------------------------------------------------------------------+
|                              CLIENT (SPA)                               |
|   React 18/19 + TypeScript + Vite + Tailwind CSS + TanStack Query       |
|                                                                         |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | Opportunity Feed  |  | Student Tracker    |  | Admin Moderation   |  |
|  | & Search Engine   |  | & Saved Listings   |  | & Audit Portal     |  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  +-------------------------------------------------------------------+  |
|  |           Localization Layer (i18n: English / Amharic)            |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------+------------------------------------+
                                     | HTTPS / JSON REST API
                                     | Credentials: Secure HttpOnly Cookies
                                     v
+------------------------------------+------------------------------------+
|                             BACKEND API                                 |
|                   Node.js + Express + TypeScript                        |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Security Middleware (Helmet, CORS, Rate Limit, Session, CSRF)     |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+  |
|  | Auth & Users       |  | Opportunities      |  | Student Tracker    |  |
|  | - Register / Login |  | - Search & Filter  |  | - 7-Stage Status   |  |
|  | - Session & RBAC   |  | - Submission Flow  |  | - Private Notes    |  |
|  +--------------------+  +--------------------+  +--------------------+  |
|  +--------------------+  +--------------------+  +--------------------+  |
|  | Moderation Queue   |  | Saved Listings     |  | Audit Logs &      |  |
|  | - Verify / Expire  |  | - Unique Bookmarks |  | User Reports       |  |
|  +--------------------+  +--------------------+  +--------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Data Layer: Mongoose ODM, Validation Schemas, In-Memory/Atlas DB  |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     v
                        +---------------------------+
                        |  MongoDB (Atlas / Memory) |
                        +---------------------------+
```

---

## 2. Repository Structure

```
TemariHub/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated lint, typecheck, test workflow
├── docs/
│   ├── PRODUCT_REQUIREMENTS.md    # Product goals, user stories & scope
│   ├── ARCHITECTURE.md            # System topology & design decisions
│   ├── DATABASE_DESIGN.md         # Mongoose schemas, relationships & indexes
│   ├── API_DOCUMENTATION.md       # REST API endpoints, schemas & errors
│   ├── SECURITY.md                # Threat model, RBAC & auth flow
│   └── TESTING.md                 # Test plan, Supertest, Vitest guidelines
├── client/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/            # Button, Input, Modal, Badge, Card, Spinner
│   │   │   ├── layout/            # Navbar, Footer, Sidebar, PageContainer
│   │   │   ├── opportunities/     # OpportunityCard, FilterSidebar, SearchBar
│   │   │   ├── tracker/           # TrackerBoard, StatusBadge, NotesModal
│   │   │   └── admin/             # ModerationTable, AuditLogViewer
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # User session, login, logout, roles
│   │   │   └── I18nContext.tsx    # Language switch (en/am), dictionary provider
│   │   ├── hooks/                 # Custom React hooks (useDebounce, useAuth, etc.)
│   │   ├── i18n/
│   │   │   ├── en.json            # English translations
│   │   │   └── am.json            # Amharic translations
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── OpportunitiesPage.tsx
│   │   │   ├── OpportunityDetailPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── StudentDashboardPage.tsx
│   │   │   ├── StudentProfilePage.tsx
│   │   │   ├── SavedOpportunitiesPage.tsx
│   │   │   ├── ApplicationTrackerPage.tsx
│   │   │   ├── SubmitOpportunityPage.tsx
│   │   │   ├── SubmissionStatusPage.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── ModerationQueuePage.tsx
│   │   │   ├── ReportsManagementPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   └── ErrorPage.tsx
│   │   ├── services/              # API clients using Fetch / Axios
│   │   ├── types/                 # Shared TypeScript interfaces
│   │   ├── utils/                 # Date formatting, validators, constants
│   │   ├── App.tsx                # Route definitions & TanStack Query Provider
│   │   ├── main.tsx               # Root entry point
│   │   └── index.css              # Tailwind directives and custom CSS tokens
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # Mongoose connection & disconnect helpers
│   │   │   ├── env.ts             # Validated environment variables (Zod)
│   │   │   └── universities.ts    # Seed list of Ethiopian universities & STEM fields
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # Session verification & RBAC guard
│   │   │   ├── error.middleware.ts# Centralized error handler
│   │   │   ├── rateLimiter.ts     # Express rate limiter configuration
│   │   │   └── validate.ts        # Request body/query validator middleware
│   │   ├── modules/
│   │   │   ├── auth/              # Registration, login, logout, current user
│   │   │   ├── users/             # User profile, student academic metadata
│   │   │   ├── opportunities/     # Opportunity CRUD, search, filter, verify
│   │   │   ├── applications/      # Student tracker & 7 status stage management
│   │   │   ├── saved/             # Opportunity bookmarking & duplicate checks
│   │   │   ├── moderation/        # Admin approval, rejection, report review
│   │   │   └── audit/             # Administrative audit logging
│   │   ├── utils/                 # Password hashing, logger, slug generator
│   │   ├── app.ts                 # Express application assembly
│   │   └── server.ts              # HTTP listener entrypoint
│   ├── tests/
│   │   ├── setup.ts               # MongoMemoryServer lifecycle
│   │   ├── auth.test.ts
│   │   ├── opportunities.test.ts
│   │   ├── tracker.test.ts
│   │   └── moderation.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── .gitignore
├── package.json                   # Root workspace package orchestrating client & server
└── README.md
```

---

## 3. Frontend Architecture

### 3.1. Design Tokens & UI Aesthetics
- **Color Palette:**
  - *Primary Navy:* `#0A192F` (Deep Midnight Blue for trust, professionalism, depth).
  - *Secondary Slate:* `#1E293B` to `#334155` (Subtle container backgrounds and elevated cards).
  - *Accent Gold/Amber:* `#D97706` (High-visibility highlights representing opportunity and success).
  - *Teal Accent:* `#0D9488` (Verified checkmarks, affirmative actions, freshness).
  - *Surface Light:* `#F8FAFC` to `#FFFFFF` (Clean, uncluttered, accessible light mode).
- **Typography:**
  - Latin: Inter / Outfit for high legibility on digital screens.
  - Ethiopic (Amharic): Noto Sans Ethiopic with line-height adjustments (1.6+) to accommodate diacritics and fidel markers.
- **Micro-interactions:**
  - Card hover scale (`transform: translateY(-2px)`), skeleton loaders, smooth accordion filters, and subtle toast notifications.

### 3.2. Localization Architecture (English & Amharic)
- **Zero-Flicker Architecture:** Translation dictionaries (`en.json`, `am.json`) are bundled synchronously.
- **Route Preservation:** Switching language does not mutate URL parameters or trigger a page reload. Context preserves input states.
- **Interpolation Engine:** Lightweight translation function `t('key', { params })` with nested key lookup (`t('nav.opportunities')`).

### 3.3. State Management & Data Fetching
- **Server Cache:** `TanStack Query` (React Query) handles caching, pagination state, background refetching, and optimistic updates for bookmarking.
- **Client Session:** React Context (`AuthContext`) manages user authentication state, token refresh, and RBAC permissions.

---

## 4. Backend Architecture & Modular Monolith

### 4.1. Request Lifecycle
1. **Security & Protocol:** Helmet headers, CORS restrictions, JSON body parser.
2. **Rate Limiting:** IP-based sliding window on authentication and submission routes.
3. **Session Authentication:** Validates session cookie, queries cache/database, attaches `req.user`.
4. **Validation Pipeline:** Zod schema validation parses and sanitizes request parameters, body, and query strings.
5. **Controller Layer:** Coordinates business services, delegates persistence to Mongoose models.
6. **Centralized Error Handling:** Formats unexpected or operational errors into uniform JSON payloads without leaking internal stack traces.

### 4.2. Database Abstraction
- Mongoose ODM provides schema validation, middleware hooks (pre-save hashing, slug generation), and indexing.
- For development and automated testing in environments without an external MongoDB daemon, `mongodb-memory-server` is seamlessly utilized as a fallback or in-memory fixture provider.

---

## 5. Security & Access Control Boundaries

| Resource | Public / Unauth | Student | Submitter | Admin |
|---|---|---|---|---|
| Opportunity Feed (Published) | Read Only | Read Only | Read Only | Full Access |
| Opportunity Detail (Published)| Read Only | Read Only | Read Only | Full Access |
| Opportunity Detail (Draft/Pending)| Forbidden | Forbidden | Read (Own Only)| Full Access |
| Submit Opportunity | Forbidden | Forbidden | Create / Read (Own) | Full Access |
| Save Opportunity | Forbidden | Create / Read / Delete (Own) | Forbidden | Read (Own) |
| Application Tracker (7 Stages)| Forbidden | Full Access (Own Only) | Forbidden | Forbidden |
| Student Profile & Notes | Forbidden | Full Access (Own Only) | Forbidden | Forbidden |
| Moderation Queue & Reports | Forbidden | Forbidden | Forbidden | Full Access |
| Audit Logs | Forbidden | Forbidden | Forbidden | Full Access |

---

## 6. Build, Testing & Deployment Pipeline

- **Frontend Build:** `vite build` outputs static assets configured with client-side SPA routing rewrites.
- **Backend Build:** `tsc` compiles TypeScript to `dist/`, executed via `node dist/server.js`.
- **Automated Verification:**
  - `npm run lint` — ESLint verification across client and server.
  - `npm run typecheck` — Strict TypeScript checking (`tsc --noEmit`).
  - `npm run test` — Vitest + Supertest integration tests against in-memory MongoDB.
