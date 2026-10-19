# TemariHub — Security Architecture & Threat Model

**Status:** Active  
**Scope:** Authentication, Session Storage, Access Control, Data Privacy, and API Hardening  

---

## 1. Threat Model & Risk Analysis

| Threat / Attack Vector | Target Impact | Mitigation Strategy in TemariHub |
|---|---|---|
| **Credential Stuffing & Brute Force** | Account takeover | Argon2id/bcrypt (salt 12+), rate limiting on `/api/v1/auth/login`, generic error messages. |
| **Privilege Escalation** | Regular user registering as Admin | Role assignment locked on server. `role: 'admin'` rejected by public registration endpoint with HTTP 403. |
| **NoSQL Injection** | Data leakage or tampering | Strict Zod validation and Mongoose schema typing; avoid unescaped `$where` or raw object queries. |
| **Cross-Site Scripting (XSS)** | Token theft, session hijacking | `HttpOnly` session cookies (inaccessible to client JavaScript), React auto-escaping, Helmet CSP headers. |
| **Cross-Site Request Forgery (CSRF)**| Unauthorized state changes | SameSite cookie policy, origin/referer validation on mutating requests, and double-submit/CSRF tokens. |
| **Student Privacy Leakage** | Exposure of private notes & tracker | Strict server-side resource ownership checks (`tracker.userId === req.user._id`). Notes excluded from all public feeds. |
| **Inaccurate / Malicious Listings** | Phishing or scamming students | Two-tier publishing: submitters cannot publish directly; mandatory original source URL; admin moderation queue. |

---

## 2. Authentication & Session Strategy

### 2.1. Password Hashing
- TemariHub uses `bcrypt` (with a cost factor of 12) or `argon2id` for all password digests.
- Passwords are never logged or stored in plaintext.
- Schema definition marks `passwordHash` with `select: false` so that standard Mongoose queries do not accidentally project the hash into memory.

### 2.2. Standardized Server-Side Sessions & Cookie Security
Authentication in TemariHub is standardized on **stateful server-side sessions** (or cryptographically signed session tokens) referenced via secure `HttpOnly` cookies. No credentials or raw authentication tokens are stored in browser localStorage or sessionStorage.

- **Cookie Security Configuration:**
  - `name: 'temarihub_sid'`
  - `httpOnly: true`: Completely inoperable from client-side JavaScript (`document.cookie`), neutralizing token theft via Cross-Site Scripting (XSS).
  - `secure: process.env.NODE_ENV === 'production'`: Transmitted exclusively over encrypted TLS/HTTPS connections in staging and production.
  - `sameSite: 'lax'`: Guarantees the cookie is withheld on cross-origin subrequests, providing foundational CSRF mitigation while permitting standard top-level navigation.
  - `path: '/'`: Scoped to the application root.
  - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days duration with rolling renewal on active interaction).

- **Session Lifecycle & Invalidation:**
  - **Session Rotation on Authentication:** Upon successful login or credential verification, the previous session identifier is destroyed and a newly regenerated session ID is issued (`req.session.regenerate()`), completely eliminating session fixation attacks.
  - **Explicit Invalidation on Logout:** Calling `POST /api/v1/auth/logout` explicitly destroys the session record in the server session store and sets an expired cookie (`expires: new Date(0)`) to ensure the client drops the cookie immediately.

- **CSRF Defense-in-Depth:**
  - In addition to `SameSite: 'lax'`, all mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) require custom HTTP headers (e.g., `X-Requested-With: XMLHttpRequest` or standard CSRF token verification) and origin/referer header matching against the configured `CLIENT_URL`. Cross-origin form posts from third-party websites are rejected.

- **Environment & Secrets Hygiene:**
  - All template configurations (`.env.example`) contain placeholders only. No hardcoded or default session secrets are committed to version control.
  - In production deployments, `SESSION_SECRET` must be explicitly provided and be at least 32 characters in length. The application fails fast on startup if the production secret is missing, short, or matches development placeholders.
  - Secrets and credentials are never printed or logged.

### 2.3. Administrator Provisioning Security & Role Escalation Refusal
- Public registration endpoints reject any attempt to self-assign the `admin` role with HTTP 400.
- Provisioning an initial administrator is performed strictly via a protected CLI bootstrap script (`npm run seed:admin`) requiring `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` (minimum 8 characters).
- **Anti-Privilege Escalation Policy:** The provisioning script strictly refuses to automatically promote an existing `student` or `submitter` account to `admin`. This prevents accidental account takeovers or unauthorized elevation of privileges. Promoting an existing account requires an explicit, documented, separately authorized administrative procedure.
- Administrator creation is recorded in the append-only `AuditLog` (`action: 'admin_provisioned'`, `targetType: 'user'`).

---

## 3. Role-Based Access Control (RBAC)

The platform enforces three distinct user roles:

1. **`student`**:
   - Access to public opportunity discovery.
   - Read and write access to their own academic profile.
   - Read and write access to their own bookmarks (`SavedOpportunity`).
   - Read and write access to their own application tracker entries and private notes (`ApplicationTracker`).
   - Ability to submit user reports regarding listings.
2. **`submitter`**:
   - Access to public opportunity discovery.
   - Ability to submit opportunity listings into the moderation queue.
   - Read and edit access to their own pending or draft listings.
3. **`admin`**:
   - Access to the administrative moderation dashboard.
   - Ability to inspect, approve, reject, publish, archive, and expire opportunities.
   - Ability to resolve user reports.
   - Access to view audit logs and system telemetry.

### RBAC Enforcement Middleware:
- Every protected endpoint passes through `requireAuth` and optional `requireRole('admin')` or `requireRole(['student', 'admin'])`.
- Resource ownership validation is performed in the service/controller layer before any update or delete operation:
  ```typescript
  if (tracker.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('You are not authorized to modify this tracking entry.');
  }
  ```

---

## 4. Input Validation & Request Hardening

- **Zod Schema Validation:**
  - All incoming request bodies, route parameters, and query strings are parsed through deterministic Zod schemas.
  - Extraneous fields are automatically stripped.
- **Express Rate Limiting:**
  - General API: 120 requests per minute per IP.
  - Auth routes (`/api/v1/auth/login`, `/register`): 10 attempts per 15-minute window per IP.
  - Submission routes: 20 submissions per hour per user.
- **HTTP Security Headers (via Helmet):**
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY` (Clickjacking defense)
  - `X-Content-Type-Options: nosniff` (MIME sniffing defense)
  - `Strict-Transport-Security` (HSTS in production)

---

## 5. Privacy Boundaries & Data Protection

- **Student Private Notes:** Private notes recorded in the Application Tracker are strictly confidential. Under no circumstances are tracker notes surfaced in search APIs, public feeds, or employer views.
- **Error Disclosures:**
  - Stack traces are omitted in production environments (`NODE_ENV === 'production'`).
  - Authentication errors state: *"Invalid email or password"* rather than distinguishing whether the email or the password was incorrect.

---

## 6. Documented Limitations & Operational Security

1. **Local Development In-Memory DB:** In local testing without a live MongoDB daemon, `mongodb-memory-server` is used for automated integration tests. In production, a secure TLS connection string to MongoDB Atlas with IP allowlisting must be configured.
2. **Email Verification:** Phase 0/MVP verifies identity by credential validation. Full SMTP email confirmation links can be attached in a subsequent release once credentials (e.g., SendGrid/AWS SES) are provisioned.
3. **Audit Trail Immutability:** Audit logs are append-only; administrative endpoints do not provide deletion routes for the `audit_logs` collection.
