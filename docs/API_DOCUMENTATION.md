# TemariHub — REST API Documentation

**API Base URL:** `/api/v1`  
**Data Format:** JSON (`application/json`)  
**Authentication Scheme:** Secure Session / HttpOnly Cookie with CSRF protection  

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
      "field": "email",
      "message": "A valid email address is required."
    }
  ],
  "statusCode": 400
}
```

---

## 2. Authentication & Identity Endpoints (`/api/v1/auth`)

### 2.1. Register New Account
- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Kidus Hailu",
  "email": "kidus@astu.edu.et",
  "password": "SecurePassword123!",
  "role": "student"
}
```
*Note: Public registration allows `role: "student"` or `role: "submitter"`. Attempting to register as `admin` will return HTTP 403 Forbidden.*

### 2.2. Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "kidus@astu.edu.et",
  "password": "SecurePassword123!"
}
```
- **Response:** Sets HttpOnly session cookie, returns sanitized user profile.

### 2.3. Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Access:** Authenticated
- **Response:** Clears session cookie, invalidates server session.

### 2.4. Current Authenticated User (`/me`)
- **Endpoint:** `GET /api/v1/auth/me`
- **Access:** Authenticated
- **Response:** Returns current user ID, name, email, and role.

---

## 3. Student Profile Endpoints (`/api/v1/profile`)

### 3.1. Get Current Student Profile
- **Endpoint:** `GET /api/v1/profile/me`
- **Access:** Student only (`role: 'student'`)

### 3.2. Update Student Profile
- **Endpoint:** `PUT /api/v1/profile/me`
- **Access:** Student only
- **Request Body:**
```json
{
  "university": "ASTU",
  "degreeLevel": "undergraduate",
  "fieldOfStudy": "Software Engineering",
  "graduationYear": 2026,
  "skills": ["TypeScript", "React", "Python", "Docker"],
  "preferredLocations": ["Addis Ababa", "Adama", "Remote"],
  "preferredArrangements": ["remote", "hybrid"],
  "bio": "Third-year software engineering student passionate about full-stack web platforms."
}
```

---

## 4. Opportunity Discovery Endpoints (`/api/v1/opportunities`)

### 4.1. List & Search Opportunities
- **Endpoint:** `GET /api/v1/opportunities`
- **Access:** Public (Only published & approved listings returned)
- **Query Parameters:**
  - `search` (string): Text search across title, description, skills, organization
  - `type` (comma-separated): `internship,hackathon,scholarship,entry_level_job,fellowship,training`
  - `workArrangement` (comma-separated): `on_site,remote,hybrid`
  - `level` (comma-separated): `undergraduate,postgraduate,recent_graduate`
  - `field` (string): Academic field filter (e.g. `Software Engineering`)
  - `location` (string): City/region filter (e.g. `Addis Ababa`, `Adama`)
  - `includeExpired` (boolean): Default `false`
  - `sort`: `deadline_asc`, `deadline_desc`, `newest` (default)
  - `page` (number): Default `1`
  - `limit` (number): Default `12`

### 4.2. Get Opportunity Details
- **Endpoint:** `GET /api/v1/opportunities/:idOrSlug`
- **Access:** Public for published items; Submitter (own) or Admin for drafts/pending.

### 4.3. Submit New Opportunity
- **Endpoint:** `POST /api/v1/opportunities/submit`
- **Access:** Authenticated Submitter or Admin
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

### 4.4. List My Submissions
- **Endpoint:** `GET /api/v1/opportunities/my-submissions`
- **Access:** Authenticated Submitter

---

## 5. Saved Opportunities Endpoints (`/api/v1/saved-opportunities`)

### 5.1. List Saved Opportunities
- **Endpoint:** `GET /api/v1/saved-opportunities`
- **Access:** Student only

### 5.2. Save an Opportunity
- **Endpoint:** `POST /api/v1/saved-opportunities/:opportunityId`
- **Access:** Student only (Duplicate saves return 200 with existing bookmark)

### 5.3. Remove Saved Opportunity
- **Endpoint:** `DELETE /api/v1/saved-opportunities/:opportunityId`
- **Access:** Student only

---

## 6. Application Tracker Endpoints (`/api/v1/tracker`)

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
- **Endpoint:** `PUT /api/v1/tracker/:trackerId`
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
- **Endpoint:** `DELETE /api/v1/tracker/:trackerId`
- **Access:** Student only (Owner only)

---

## 7. Opportunity Reporting (`/api/v1/reports`)

### 7.1. Report Opportunity
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

## 8. Administration & Moderation Endpoints (`/api/v1/admin`)

### 8.1. Moderation Queue
- **Endpoint:** `GET /api/v1/admin/moderation/queue`
- **Access:** Admin only
- **Query Params:** `status=pending`, `page=1`, `limit=10`

### 8.2. Update Moderation Decision
- **Endpoint:** `PUT /api/v1/admin/moderation/:id/decision`
- **Access:** Admin only
- **Request Body:**
```json
{
  "decision": "approve", // or "reject"
  "reviewNotes": "Original source URL verified with company LinkedIn page."
}
```

### 8.3. List User Reports
- **Endpoint:** `GET /api/v1/admin/reports`
- **Access:** Admin only

### 8.4. Resolve User Report
- **Endpoint:** `PUT /api/v1/admin/reports/:reportId/resolve`
- **Access:** Admin only
- **Request Body:**
```json
{
  "status": "resolved",
  "resolutionNotes": "Link verified and updated to mirror portal."
}
```

### 8.5. View Audit Logs
- **Endpoint:** `GET /api/v1/admin/audit-logs`
- **Access:** Admin only
- **Query Params:** `action`, `limit=50`

### 8.6. Platform Statistics
- **Endpoint:** `GET /api/v1/admin/stats`
- **Access:** Admin only
- **Response:** Aggregate numbers of published opportunities, active students, pending reviews, and tracker submissions.
