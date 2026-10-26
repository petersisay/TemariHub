# TemariHub — Product Requirements Document (PRD)

**Project:** TemariHub (ተማሪሀብ)  
**Tagline:** Discover opportunities. Build your future. (ዕድሎችን ያግኙ። የወደፊትዎን ይገንቡ።)  
**Version:** 1.0 — Production Release  
**Target Audience:** Ethiopian university students in STEM/Technology, recent graduates, opportunity submitters, and platform administrators.  
**Pilot Focus:** Adama Science and Technology University (ASTU) and Addis Ababa University (AAU/AAiT), with configurable multi-university support across Ethiopia (BDU, Hawassa, Jimma, Haramaya, etc.).  
**Languages:** English (Primary), Amharic (Secondary).  
**Production URLs:**
- **Frontend Web Application:** [https://temari-hub.vercel.app](https://temari-hub.vercel.app)
- **Backend API Service:** [https://temarihub-api.onrender.com](https://temarihub-api.onrender.com)
- **Repository:** [https://github.com/petersisay/TemariHub](https://github.com/petersisay/TemariHub)

---

## 1. Executive Summary & Problem Statement

Ethiopian higher education institutions graduate tens of thousands of STEM students each year. However, access to legitimate internships, junior developer roles, hackathons, graduate scholarships, research fellowships, and technical training opportunities remains severely fragmented:
- **Scattered Information:** Opportunities are haphazardly shared across informal Telegram channels, Facebook groups, and university notice boards.
- **Verification & Fraud Risks:** Students frequently encounter expired links, unverified listings, or fraudulent schemes without recourse.
- **Application Disorganization:** Students lack a unified, private dashboard to monitor application deadlines, requirements, and progress.
- **Language Inclusivity:** While STEM education in Ethiopia is conducted in English, navigation, support guidance, and localization in Amharic dramatically enhance accessibility and user confidence.

**TemariHub** bridges this gap by delivering a centralized, trustworthy, bilingual web application that aggregates verified opportunities, tracks student applications securely across 7 structured stages, and provides transparent moderation workflows with verified source monitoring.

---

## 2. User Roles & Personas

### 2.1. The STEM Student / Graduate (e.g., "Kidus", 3rd-year Software Engineering at ASTU)
- **Role:** `student`
- **Goals:** Find verified summer internships and local/remote tech opportunities; keep track of submission deadlines and status in one place.
- **Pain Points:** Misses deadlines because notifications get buried in Telegram chats; wastes time applying to expired or unverified listings.
- **Needs:** Fast search with filters (by university level, required skills, work arrangement), bookmarking (`/saved`), a private application tracker (`/tracker`) with 7 status stages and notes, unique `@username`, and bilingual UI.
- **Access Boundary:** Students cannot submit opportunities for publication or access moderation/admin features.

### 2.2. The Opportunity Submitter (Designated Account: `petrossisay7164@gmail.com`)
- **Role:** `submitter`
- **Goals:** Reach qualified Ethiopian STEM talent for hackathons, internships, or fellowships.
- **Pain Points:** Overwhelmed with unqualified applicants or lacking a dedicated platform beyond social media.
- **Needs:** Structured submission form (`/submit`) requiring verification URLs, eligibility requirements, and deadlines; tracking own submissions (`/submission-status`); editing existing submissions with automatic re-verification queuing (`PUT /api/v1/opportunities/:id`).
- **Access Boundary:** Submitters cannot self-approve, self-verify, or publish opportunities directly. Submissions and material edits require administrative review. Submitters cannot use the student Application Tracker or "Apply Now" workflow.

### 2.3. The Platform Administrator (Designated Account: `petrossisay1646@gmail.com`)
- **Role:** `admin`
- **Goals:** Maintain high trust, data integrity, and strict verification standards on TemariHub.
- **Needs:** Dedicated moderation queue (`/admin`, `/moderation`), verification queue (`/admin/opportunities/verification-queue`) with evidence recording (`POST /admin/opportunities/:id/verify`), trusted source management (`/sources`), user report resolution, and immutable audit logs (`/admin/audit-logs`).
- **Access Boundary:** Administrators oversee platform integrity and cannot use student application tracking features.

---

## 3. Product Scope & Feature Matrix

| Feature Module | In Production Scope (v1.0) | Future Roadmap Consideration |
|---|---|---|
| **Authentication** | **Google-Only Authentication** via Google Identity Services (`POST /api/v1/auth/google`) with cryptographic ID token verification (`google-auth-library`), server-side sessions with `connect-mongo`, secure `HttpOnly` cookies, self-healing session index cleanup. Legacy password registration/login is permanently disabled with 403 Forbidden. | Additional OAuth providers (GitHub, LinkedIn). |
| **User Profile & Identity** | Unique `@username` validation (3-30 chars, lowercase alphanumeric, 30+ reserved system usernames), unified profile endpoint (`/api/v1/profile`), custom avatar upload with WebP conversion, 5MB limit, square cropping, and Google profile picture fallback. | Verifiable digital badge credentials, PDF resume parser. |
| **Opportunity Discovery** | Search (title, org, description, skills), multifaceted filters (category, field, level, location, arrangement), sorting, pagination, verified badge, detail view with official application URL and original source verification link. | Recommendation engine based on student academic skills. |
| **Trusted Source Monitoring** | Continuous automated discovery from 12 verified candidate sources (ASTU, AAU, DAAD, Mastercard Foundation, GSoC, MLH, UNICEF, UNDP, Safaricom Ethiopia, Ethiopian AI Institute, Ethiopian Airlines Careers, Gebeya) with SSRF defenses. Discovered items enter `PENDING_REVIEW` & `draft`; never auto-published without admin review. | Additional university portal RSS/API connectors. |
| **Student Tracker** | 7 statuses (*Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*), applied date, private notes, deadline warnings. | Direct one-click application submission to third-party ATS. |
| **Saved Bookmarks** | Save/unsave opportunities with compound unique constraints (`/api/v1/saved`). | Shared/public collection lists. |
| **Submitter Portal & Editing** | Submitter portal (`/submit`), submission status page (`/submission-status`), and full editing capability (`PUT /api/v1/opportunities/:id`). Material edits reset status to `draft` and `PENDING_REVIEW`. | Multi-user company recruiter teams. |
| **Moderation & Trust** | Verification queue (`/admin/opportunities/verification-queue`), evidence recording, approve/reject with feedback, listing expiration, user reporting system, immutable audit trail. | Automated ML content scoring. |
| **Localization** | Dynamic English/Amharic switcher, persistent language state, full UI dictionary (navigation, forms, buttons, alerts). | Real-time machine translation of listing bodies. |

---

## 4. Detailed Functional Requirements

### 4.1. Authentication & Session Management
- **FR-AUTH-01 (Google-Only Authentication):** Authentication is performed exclusively via Google Identity Services (GIS). The frontend receives an ID token and submits it to `POST /api/v1/auth/google`.
- **FR-AUTH-02 (Token Verification):** The backend validates the Google ID token against `GOOGLE_CLIENT_ID` using `google-auth-library`. User records are matched or created via verified `googleId` and email.
- **FR-AUTH-03 (Role Assignment & Non-Escalation):** Designated emails automatically receive their authorized roles:
  - `petrossisay1646@gmail.com` -> `admin`
  - `petrossisay7164@gmail.com` -> `submitter`
  - All other users register as `student`. Public role escalation requests are strictly rejected.
- **FR-AUTH-04 (Legacy Auth Deprecation):** Legacy password-based endpoints (`/api/v1/auth/login` and `/api/v1/auth/register`) return HTTP 403 Forbidden with a clear deprecation message directing users to Google sign-in.
- **FR-AUTH-05 (Session & Cookie Security):** Sessions are stored server-side in MongoDB via `connect-mongo`. Cookies are configured with `HttpOnly`, `SameSite: 'none'` (cross-origin production) or `SameSite: 'lax'`, and `Secure: true` in production. Session IDs are regenerated upon sign-in.
- **FR-AUTH-06 (Index Self-Healing):** Server startup automatically checks for and prunes obsolete or problematic indexes (such as `sessionTokenHash_1`) on the users collection to prevent database errors.

### 4.2. User Profiles & Avatars
- **FR-PROF-01 (Unique Username):** Every user can establish or update a unique `@username` (3-30 characters, lowercase alphanumeric with underscores/hyphens). System reserves over 30 administrative terms (e.g., `admin`, `moderator`, `temarihub`, `api`, `support`).
- **FR-PROF-02 (Unified Profile Endpoint):** `GET /api/v1/profile` and `PUT /api/v1/profile` provide a single interface for managing user metadata, bio, institution, notification preferences, and student academic details.
- **FR-PROF-03 (Custom Avatar Upload):** `POST /api/v1/profile/avatar` accepts image files (JPEG, PNG, WebP) up to 5MB, converts them into optimized square WebP images, and stores them securely.
- **FR-PROF-04 (Avatar Reset & Fallback):** `DELETE /api/v1/profile/avatar` clears the custom avatar, automatically falling back to the user's Google account picture or deterministic default avatar.
- **FR-PROF-05 (Privacy Boundary):** Student academic profiles and private application notes are accessible only by the owning student and administrators. Cross-student inspection is blocked.

### 4.3. Opportunity Discovery & Exploration
- **FR-OPP-01 (Public Invariant):** Public opportunity feeds and search return ONLY listings where `publicationStatus: 'published'` AND `verificationStatus: 'VERIFIED'`. Expired listings are filtered out by default.
- **FR-OPP-02 (Multi-Filter & Search):** Full-text search over title, organization, description, and required skills, combined with filters:
  - Category: `internship`, `entry_level_job`, `scholarship`, `hackathon`, `fellowship`, `training`.
  - Work Arrangement: `on_site`, `remote`, `hybrid`.
  - Education Level & Field of Study.
  - Location (Ethiopian regional cities or international remote).
- **FR-OPP-03 (Sorting & Pagination):** Default sorting by `createdAt` (newest first) or `deadline` (closing soonest), with configurable page limits.
- **FR-OPP-04 (Detail View & Evidence):** Opportunity detail view displays organization branding, verified badge, full description, eligibility criteria, deadline status countdown, external application URL, and verified original source link.

### 4.4. Student Application Tracker & Bookmarks
- **FR-TRK-01 (Bookmarking):** Authenticated students can save/unsave listings via `POST /api/v1/saved/:opportunityId` and view saved bookmarks via `GET /api/v1/saved`. Duplicate bookmarks are prevented by compound unique indexing.
- **FR-TRK-02 (7-Stage Tracker):** Students can track applications across 7 discrete stages:
  1. *Interested* (ፍላጎት አለኝ)
  2. *Preparing* (በመዘጋጀት ላይ)
  3. *Applied* (አመልክቻለሁ)
  4. *Interview* (ቃለ-መጠይቅ)
  5. *Accepted* (ተቀባይነት አግኝቷል)
  6. *Rejected* (ያልተሳካ)
  7. *Withdrawn* (የተሰረዘ)
- **FR-TRK-03 (Private Notes & Timeline):** Each tracked application maintains `appliedDate`, `stage`, and encrypted/private `notes`.
- **FR-TRK-04 (Role Guard):** Submitters and administrators are blocked from accessing student application tracker routes (`/tracker`, `/api/v1/applications`).

### 4.5. Submitter Portal & Submission Lifecycle
- **FR-SUB-01 (Structured Submission):** Submitters enter structured metadata: Title, Organization, Category, Requirements, Skills, Location, Deadline, Official Application URL, and Source URL.
- **FR-SUB-02 (Initial State):** Newly submitted listings are created with `moderationStatus: 'pending'`, `publicationStatus: 'draft'`, and `verificationStatus: 'PENDING_REVIEW'`.
- **FR-SUB-03 (Submission Tracking):** Submitters monitor their listings at `/submission-status` (`GET /api/v1/opportunities/my-submissions`), showing review progress, verification state, and moderation notes.
- **FR-SUB-04 (Submission Editing):** Submitters can edit their submissions via `PUT /api/v1/opportunities/:id`. Material changes to title, organization, eligibility, or URLs automatically reset the opportunity's status to `draft` and `PENDING_REVIEW` for mandatory administrative re-verification.

### 4.6. Trusted Source Monitoring & Admin Verification
- **FR-SRC-01 (12 Verified Sources):** TemariHub monitors 12 trusted Ethiopian and international tech/scholarship sources:
  1. Adama Science and Technology University (ASTU)
  2. Addis Ababa University (AAU)
  3. DAAD Ethiopia Information Point
  4. Mastercard Foundation Scholars Program
  5. Google Summer of Code (GSoC)
  6. Major League Hacking (MLH)
  7. UNICEF Ethiopia
  8. UNDP Ethiopia
  9. Safaricom Ethiopia Careers
  10. Ethiopian Artificial Intelligence Institute (EAII)
  11. Ethiopian Airlines Careers
  12. Gebeya Talent Network
- **FR-SRC-02 (SSRF Protection):** Automated source fetching enforces strict SSRF protections in `SourceMonitorService`, blocking `localhost`, `127.0.0.1`, private IP blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata IP endpoints (`169.254.169.254`).
- **FR-SRC-03 (Automated Ingest Invariant):** Discovered announcements are ingested exclusively in `PENDING_REVIEW` and `draft` status. Automatic publication is strictly forbidden.
- **FR-SRC-04 (Verification Queue):** Administrators review candidate opportunities in `/admin/opportunities/verification-queue` (`GET /api/v1/opportunities/admin/verification-queue`).
- **FR-SRC-05 (Evidence Verification):** Administrators verify listings via `POST /api/v1/opportunities/:id/verify`, recording official source links, verification notes, and administrator ID. This transitions the listing to `VERIFIED` and `published`.

### 4.7. Internationalization (i18n)
- **FR-I18N-01:** Full dual-language support for English (`en`) and Amharic (`am`).
- **FR-I18N-02:** Language preference persists across user sessions and in `localStorage`.
- **FR-I18N-03:** Comprehensive dictionary coverage for navigation, interactive forms, verification badges, status messages, and tracker stages.
- **FR-I18N-04:** Timezone calculations aligned with East Africa Time (EAT, UTC+3 / `Africa/Addis_Ababa`).

---

## 5. Non-Functional Requirements

- **NFR-SEC-01 (Authentication Integrity):** All user authentication is verified via Google's public key certificates. Sessions are tamper-proof using signed HMAC tokens.
- **NFR-SEC-02 (RBAC Enforcement):** Strict authorization checks verify user role permissions at both UI route gates (`ProtectedRoute.tsx`) and API controller layers.
- **NFR-SEC-03 (Defense-in-Depth):** Helmet security headers, rate limiting (auth routes 10 req/15min, API routes 100 req/15min), CORS validation against `CLIENT_URL`, and Zod request body validation.
- **NFR-PERF-01 (Response Latency):** Indexed opportunity queries respond in < 150ms. Static frontend bundle size optimized via Vite tree-shaking.
- **NFR-REL-01 (Data Integrity):** Relational compound indexes prevent duplicate bookmarks and orphan application records. Self-healing database startup routines prevent index schema drift.
- **NFR-ACC-01 (Accessibility):** WCAG 2.1 AA compliant typography, minimum 4.5:1 color contrast, keyboard navigable modals, and `prefers-reduced-motion` animation fallbacks.
