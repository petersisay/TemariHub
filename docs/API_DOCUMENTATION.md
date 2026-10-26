# TemariHub — REST API Documentation

**API Base URL:** `/api/v1`  
**Data Format:** JSON (`application/json`)  
**Authentication Scheme:** Google-Only Authentication (`POST /api/v1/auth/google`) with Server-Side Session & HttpOnly Cookie (`connect-mongo`)  
**CSRF Protection:** Custom Header `X-Requested-With: XMLHttpRequest` & Origin Matching against `CLIENT_URL`  

---

## 1. Standard Response Envelope & Error Format

### 1.1. Success Response Structure
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### 1.2. Error Response Structure
```json
{
  "success": false,
  "message": "Validation failed for provided input.",
  "errors": [
    {
      "field": "username",
      "message": "Username may only contain lowercase letters, numbers, underscores, and hyphens."
    }
  ],
  "statusCode": 400
}
```

---

## 2. Authentication & Identity Endpoints (`/api/v1/auth`)

### 2.1. Google-Only Authentication
- **Endpoint:** `POST /api/v1/auth/google`
- **Access:** Public (Rate-limited, CSRF-protected)
- **Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "role": "student"
}
```
- **Behavior:**
  - Validates cryptographic signature against Google certificates via `google-auth-library`.
  - Designated accounts automatically receive their authorized roles:
    - `petrossisay1646@gmail.com` -> `admin`
    - `petrossisay7164@gmail.com` -> `submitter`
    - All other users register as `student`. Public role escalation requests are strictly rejected.
  - Generates a new server session in MongoDB, invalidating any existing session to prevent session fixation.
  - Sets secure `HttpOnly` cookie (`temarihub_sid`).
- **Response:** HTTP 200 OK with sanitized user profile.

### 2.2. Current Authenticated User (`/me`)
- **Endpoint:** `GET /api/v1/auth/me`
- **Access:** Authenticated
- **Response:** Returns current user ID, name, email, username, role, avatars, and notification preferences.

### 2.3. Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Access:** Authenticated (CSRF-protected)
- **Response:** Clears session cookie, destroys server-side session in MongoDB.

### 2.4. Legacy Auth Endpoints (Retired)
- **Endpoints:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- **Status:** HTTP 403 Forbidden
- **Response:**
```json
{
  "success": false,
  "message": "Password-based authentication has been retired. Please use \"Continue with Google\" to access TemariHub.",
  "statusCode": 403
}
```

---

## 3. Profile & Avatar Management (`/api/v1/profile`)

*Alias available:* `/api/v1/students/profile`

### 3.1. Get Current Profile
- **Endpoint:** `GET /api/v1/profile/me`
- **Access:** Authenticated (All roles)
- **Response:** Returns user profile, academic metadata, avatar settings, and notification preferences.

### 3.2. Update Profile & Academic Details
- **Endpoint:** `PUT /api/v1/profile/me`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "name": "Kidus Hailu",
  "username": "kidushailu",
  "bio": "Third-year software engineering student passionate about full-stack web platforms.",
  "institution": "Adama Science and Technology University",
  "studentProfile": {
    "university": "ASTU",
    "degreeLevel": "undergraduate",
    "fieldOfStudy": "Software Engineering",
    "graduationYear": 2026,
    "skills": ["TypeScript", "React", "Python", "Docker"],
    "preferredLocations": ["Addis Ababa", "Adama", "Remote"],
    "preferredArrangements": ["remote", "hybrid"]
  }
}
```

### 3.3. Update User Preferences
- **Endpoint:** `PUT /api/v1/profile/preferences`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "deadlineAlerts": true,
  "reviewAlerts": true,
  "language": "am"
}
```

### 3.4. Upload Custom Profile Picture (Avatar)
- **Endpoint:** `POST /api/v1/profile/avatar`
- **Access:** Authenticated (Multipart/form-data)
- **Payload:** File field `avatar` (WebP, JPEG, PNG <= 5MB)
- **Behavior:** Stores cropped image and updates user record with `customAvatarUrl` and `hasCustomAvatar: true`.

### 3.5. Remove Custom Profile Picture
- **Endpoint:** `DELETE /api/v1/profile/avatar`
- **Access:** Authenticated
- **Behavior:** Clears custom avatar and restores Google profile photo (`googleAvatarUrl`) or default initial-based avatar.

---

## 4. Opportunity Discovery & Submitter Portal (`/api/v1/opportunities`)

### 4.1. List & Search Opportunities
- **Endpoint:** `GET /api/v1/opportunities`
- **Access:** Public (Returns only `published` & `VERIFIED` opportunities)
- **Query Parameters:**
  - `search` (string): Text search across title, description, skills, organization
  - `type` (comma-separated): `internship,hackathon,scholarship,entry_level_job,fellowship,training`
  - `workArrangement` (comma-separated): `on_site,remote,hybrid`
  - `level` (comma-separated): `undergraduate,postgraduate,recent_graduate`
  - `field` (string): Academic discipline filter
  - `location` (string): City/region filter
  - `includeExpired` (boolean): Default `false`
  - `sort`: `deadline_asc`, `deadline_desc`, `newest` (default)
  - `page` (number): Default `1`
  - `limit` (number): Default `12`

### 4.2. Get Opportunity Details
- **Endpoint:** `GET /api/v1/opportunities/:idOrSlug`
- **Access:** Public for published items; Submitter (own) or Admin for drafts/pending.

### 4.3. Submit New Opportunity
- **Endpoint:** `POST /api/v1/opportunities/submit` (or `POST /api/v1/opportunities`)
- **Access:** Submitter (`petrossisay7164@gmail.com`) or Admin (`petrossisay1646@gmail.com`)
- **Request Body:**
```json
{
  "title": "Summer Backend Developer Intern",
  "organization": {
    "name": "Ethiopian AI Institute",
    "websiteUrl": "https://eaiss.gov.et"
  },
  "opportunityType": "internship",
  "description": "Three-month paid internship working on NLP for Ethiopian languages.",
  "eligibleFields": ["Computer Science", "Software Engineering", "Data Science"],
  "eligibleLevels": ["undergraduate", "recent_graduate"],
  "requiredSkills": ["Python", "PyTorch", "Git"],
  "location": "Addis Ababa",
  "workArrangement": "hybrid",
  "deadline": "2026-12-01T23:59:59.000Z",
  "isRollingDeadline": false,
  "compensation": {
    "type": "stipend",
    "amount": 7500,
    "currency": "ETB",
    "period": "monthly"
  },
  "originalSourceUrl": "https://eaiss.gov.et/careers/summer-internship-2026",
  "applicationUrl": "https://eaiss.gov.et/apply"
}
```
- **Lifecycle:** Submissions are created in `draft` status with `verificationStatus: 'PENDING_REVIEW'`.

### 4.4. Edit Submitted Opportunity
- **Endpoint:** `PUT /api/v1/opportunities/:id` (or `PATCH /api/v1/opportunities/:id`)
- **Access:** Submitter (own listing only) or Admin
- **Behavior:** Material edits to title, organization, criteria, or URLs automatically reset status to `draft` and `PENDING_REVIEW` for mandatory administrative re-verification.

### 4.5. List My Submissions
- **Endpoint:** `GET /api/v1/opportunities/my-submissions`
- **Access:** Submitter or Admin
- **Response:** List of opportunities submitted by the authenticated user with verification status and moderation notes.

### 4.6. Report Opportunity
- **Endpoint:** `POST /api/v1/opportunities/:id/report`
- **Access:** Authenticated User
- **Request Body:**
```json
{
  "reason": "broken_link",
  "details": "The application portal gives a 404 error as of this morning."
}
```

---

## 5. Saved Opportunities Endpoints (`/api/v1/saved`)

*Alias available:* `/api/v1/saved-opportunities`

### 5.1. List Saved Opportunities
- **Endpoint:** `GET /api/v1/saved`
- **Access:** Student only
- **Response:** Returns bookmarked opportunities with active publication and verification metadata.

### 5.2. Save an Opportunity
- **Endpoint:** `POST /api/v1/saved/:opportunityId`
- **Access:** Student only (Idempotent: duplicate saves return HTTP 200 with existing bookmark)

### 5.3. Remove Saved Opportunity
- **Endpoint:** `DELETE /api/v1/saved/:opportunityId`
- **Access:** Student only

---

## 6. Student Application Tracker (`/api/v1/tracker`)

### 6.1. Get Student Tracker Entries
- **Endpoint:** `GET /api/v1/tracker`
- **Access:** Student only (Strict ownership check)
- **Response:** Returns tracked items with populated opportunity summary, status stage, and private notes.

### 6.2. Add Opportunity to Tracker
- **Endpoint:** `POST /api/v1/tracker`
- **Access:** Student only
- **Request Body:**
```json
{
  "opportunityId": "65b9e28f1c84a2...",
  "status": "Preparing",
  "appliedDate": "2026-10-25T00:00:00.000Z",
  "privateNotes": "Need to update CV with the recent ASTU robotics project before applying."
}
```

### 6.3. Update Tracker Entry
- **Endpoint:** `PUT /api/v1/tracker/:id`
- **Access:** Student only (Owner only)
- **Request Body:**
```json
{
  "status": "Applied",
  "appliedDate": "2026-10-27T00:00:00.000Z",
  "privateNotes": "Applied via official portal. Confirmation email received."
}
```

### 6.4. Delete Tracker Entry
- **Endpoint:** `DELETE /api/v1/tracker/:id`
- **Access:** Student only (Owner only)

---

## 7. Trusted Source Monitoring Endpoints (`/api/v1/sources`)

### 7.1. List Trusted Sources
- **Endpoint:** `GET /api/v1/sources`
- **Access:** Public / Authenticated
- **Response:** List of all 12 monitored sources with category, official URL, and verification status.

### 7.2. Trigger Source Monitoring Check
- **Endpoint:** `POST /api/v1/sources/:id/check`
- **Access:** Admin only
- **Behavior:** Triggers an immediate, SSRF-protected check against the specified source.

### 7.3. Trigger All Sources Monitoring Check
- **Endpoint:** `POST /api/v1/sources/check-all`
- **Access:** Admin only
- **Behavior:** Enqueues background monitoring checks across all active candidate sources.

### 7.4. Source Health & Metrics
- **Endpoint:** `GET /api/v1/sources/health/stats`
- **Access:** Admin only
- **Response:** Aggregate statistics on healthy, failing, or idle monitored sources.

---

## 8. Admin Moderation & Verification (`/api/v1/admin`)

*All admin endpoints strictly require authenticated user with `role: 'admin'` (`petrossisay1646@gmail.com`).*

### 8.1. Verification Queue
- **Endpoint:** `GET /api/v1/admin/opportunities/verification-queue`
- **Access:** Admin only
- **Query Params:** `status=PENDING_REVIEW`, `page=1`, `limit=10`

### 8.2. Verify Opportunity with Evidence
- **Endpoint:** `POST /api/v1/admin/opportunities/:id/verify` (or `PATCH /api/v1/admin/opportunities/:id/verify`)
- **Access:** Admin only
- **Request Body:**
```json
{
  "status": "VERIFIED",
  "evidence": "Confirmed live announcement on ASTU official registrar portal with active application link.",
  "notes": "Verified eligibility for 3rd and 4th year Software Engineering students."
}
```
- **Lifecycle:** Transitions opportunity to `VERIFIED` and `published`.

### 8.3. Legacy Moderation Decision
- **Endpoint:** `PUT /api/v1/admin/moderation/:id/decision`
- **Access:** Admin only
- **Request Body:**
```json
{
  "decision": "approve",
  "reviewNotes": "Original source URL verified with company LinkedIn page."
}
```

### 8.4. User Reports Management
- **Endpoint:** `GET /api/v1/admin/reports`
- **Endpoint:** `PUT /api/v1/admin/reports/:id/resolve` (or `PATCH /api/v1/admin/reports/:id`)
- **Access:** Admin only
- **Request Body:**
```json
{
  "status": "resolved",
  "resolutionNotes": "Link verified and updated to mirror portal."
}
```

### 8.5. Audit Logs & System Stats
- **Endpoint:** `GET /api/v1/admin/audit-logs` (Query: `action`, `limit`)
- **Endpoint:** `GET /api/v1/admin/stats` (Platform metrics)
- **Access:** Admin only
