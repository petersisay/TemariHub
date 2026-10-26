# TemariHub — Security Architecture & Threat Model

**Status:** Active Production  
**Scope:** Google Identity Authentication, Session Security, Role-Based Access Control, Trusted Source SSRF Defense, and Data Privacy  
**Production URLs:**
- Frontend: [https://temari-hub.vercel.app](https://temari-hub.vercel.app)
- Backend: [https://temarihub-api.onrender.com](https://temarihub-api.onrender.com)

---

## 1. Threat Model & Risk Analysis

| Threat / Attack Vector | Target Impact | Mitigation Strategy in TemariHub |
|---|---|---|
| **Google ID Token Forgery** | Account takeover or identity spoofing | Cryptographic verification of token signature, expiration, and audience (`GOOGLE_CLIENT_ID`) via `google-auth-library`. Raw tokens are never trusted without signature verification. |
| **Credential Stuffing & Password Leaks** | Account compromise | **Password authentication retired**: All users authenticate through Google Identity Services (GIS). Legacy `/register` and `/login` endpoints return HTTP 403 Forbidden. |
| **Privilege Escalation** | Unauthorized elevation to `admin` or `submitter` | Server-enforced role boundary: Only pre-authorized designated emails (`petrossisay1646@gmail.com` for admin, `petrossisay7164@gmail.com` for submitter) receive elevated roles. All other registrations default to `student`. Public role override attempts are ignored or rejected. |
| **Server-Side Request Forgery (SSRF)** | Internal network reconnaissance, AWS/GCP metadata exposure via crawler | Strict protocol enforcement (HTTPS only), hostname resolution checks, and blacklisting of loopback (`127.0.0.1`, `localhost`), link-local metadata endpoints (`169.254.169.254`), and private RFC 1918 CIDR blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) in `SourceMonitorService`. |
| **Listing Tampering / Scam Infiltration** | Fake opportunities, phishing links | Submissions enter `draft` and `PENDING_REVIEW`. Material edits by submitters reset listings to `draft` and `PENDING_REVIEW` for mandatory administrative re-verification. Opportunities are only published when verified by an administrator with recorded evidence. |
| **Cross-Site Scripting (XSS)** | Session hijacking, client manipulation | `HttpOnly` session cookies (inaccessible to client JavaScript), React auto-escaping, and strict Helmet Content-Security-Policy headers. |
| **Cross-Site Request Forgery (CSRF)** | Unauthorized state modification | Custom header verification (`X-Requested-With: XMLHttpRequest`), strict production `Origin` header matching against `CLIENT_URL`, and SameSite cookie policies. |
| **Database Index Collisions** | Service outage on user updates | Self-healing database startup routine in `server.ts` safely prunes obsolete indexes (such as `sessionTokenHash_1`) before incoming traffic is accepted. |
| **Student Privacy Leakage** | Exposure of academic details or personal tracker notes | Strict resource ownership checks (`tracker.userId === req.user._id`). Application tracker entries, private notes, and student profiles are strictly isolated from public feeds and other users. |

---

## 2. Authentication & Session Security Architecture

### 2.1. Google-Only Authentication Pipeline
TemariHub employs a **Google-First / Google-Only identity architecture**:
1. **Frontend Initiation:** The user signs in using Google Identity Services (GIS), generating a signed Google ID Token (JWT).
2. **Backend Submission:** The client delivers the ID token to `POST /api/v1/auth/google`.
3. **Cryptographic Verification:**
   ```typescript
   const ticket = await googleClient.verifyIdToken({
     idToken,
     audience: env.GOOGLE_CLIENT_ID,
   });
   const payload = ticket.getPayload();
   ```
4. **Identity & Role Binding:**
   - The user's subject identifier (`sub`) is saved to `googleId`.
   - Verified email determines role assignment:
     - `petrossisay1646@gmail.com` -> `admin`
     - `petrossisay7164@gmail.com` -> `submitter`
     - All other accounts -> `student`
5. **Session Regeneration:** The previous session is destroyed, and a fresh server session is established via `req.session.regenerate()`, preventing session fixation attacks.

### 2.2. Session Storage & Cookie Security
Authentication state is managed through stateful server sessions stored in MongoDB via `connect-mongo`:
- **`temarihub_sid` Cookie Settings:**
  - `httpOnly: true`: Completely inaccessible to browser scripts via `document.cookie`.
  - `secure: true`: Transmitted exclusively over encrypted TLS connections in production.
  - `sameSite: 'none'` (cross-origin production between Vercel frontend and Render API) or `'lax'` (development).
  - `maxAge: 604800000` (7 days duration with rolling renewal).
- **Session Destruction:** `POST /api/v1/auth/logout` explicitly deletes the session record from the MongoDB `sessions` collection and sends an expired cookie header.

### 2.3. Production Secrets Validation
In production mode, `SESSION_SECRET` must be a cryptographically secure random string with a minimum length of 32 characters. The server verifies this during initialization and **fails fast** if the secret is missing, too short, or matches common template defaults. Secrets are never logged or exposed in client bundles.

---

## 3. Strict Role-Based Access Control (RBAC)

The application enforces a rigid 3-role permission matrix:

| Feature / Domain | Student | Submitter (`petrossisay7164@...`) | Admin (`petrossisay1646@...`) |
|---|---|---|---|
| **Opportunity Discovery (Verified)** | Allowed (Read) | Allowed (Read) | Allowed (Full Access) |
| **Apply Now Workflow** | **Allowed** | **Forbidden** (Role Boundary) | **Forbidden** (Role Boundary) |
| **Application Tracker (7 Stages)** | **Allowed** (Own Only) | **Forbidden** | **Forbidden** |
| **Saved Bookmarks** | **Allowed** (Own Only) | Forbidden | Allowed (Own Only) |
| **Submit Opportunity** | Forbidden | **Allowed** (Requires review) | **Allowed** (Direct publish) |
| **Edit Submitted Opportunity** | Forbidden | **Allowed** (Resets to review) | Allowed (Full edit) |
| **Verification Queue** | Forbidden | Forbidden | **Allowed** (Record evidence) |
| **Trusted Source Monitoring** | Forbidden | Forbidden | **Allowed** (Trigger checks) |
| **Audit Logs & Reports** | Report Only | Report Only | **Allowed** (Full review) |

### Non-Escalation & Role Invariants:
1. **Submitters cannot self-approve:** An opportunity submitted or edited by a submitter cannot be published without independent administrative review.
2. **Submitters and Admins cannot track applications:** Student tracking and "Apply Now" routes (`/tracker`, `/api/v1/tracker`) are reserved strictly for students to avoid data contamination and role ambiguity.
3. **Immutable Audit Trail:** All administrative decisions (approvals, rejections, evidence verifications, source checks) create permanent append-only audit entries.

---

## 4. Trusted Source Monitoring & SSRF Protections

To protect the backend infrastructure from Server-Side Request Forgery during continuous source discovery:
1. **HTTPS Protocol Only:** All source endpoints must use encrypted HTTPS. Plaintext HTTP and local protocols (`file://`, `ftp://`) are rejected.
2. **IP Blacklist Validation:** Prior to initiating an HTTP request, the target hostname is resolved via DNS and checked against prohibited IP spaces:
   - `127.0.0.0/8` (Loopback)
   - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private networks)
   - `169.254.169.254` (Cloud instance metadata services for AWS, GCP, Azure, and DigitalOcean)
3. **Read-Only Ingest Invariant:** Discovered announcements are stored with `verificationStatus: 'PENDING_REVIEW'` and `publicationStatus: 'draft'`. Automated background scans can never publish directly to the live feed.

---

## 5. Input Validation, Uploads & API Hardening

- **Zod Schema Validation:** All incoming request bodies, parameters, and query strings are validated through deterministic Zod schemas before reaching business logic.
- **Avatar Upload Restrictions:**
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
  - Maximum file size: 5MB.
  - Image normalization: Images are cropped and converted to WebP on the client before upload, minimizing bandwidth and neutralizing malicious embedded payloads (e.g. polyglot files).
- **Rate Limiting:**
  - Authentication routes: 10 attempts per 15-minute window per IP.
  - General API: 100 requests per 15-minute window per IP.
- **HTTP Security Headers (via Helmet):**
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 6. Privacy & Data Confidentiality

- **Student Private Notes:** Private notes recorded in the Application Tracker are encrypted and stored exclusively for the authoring student. They are never returned in public opportunity payloads or shared with external recruiters.
- **Error Disclosures:**
  - Production error responses omit stack traces and system internals.
  - Authentication error responses return generic, non-enumerating messages.
