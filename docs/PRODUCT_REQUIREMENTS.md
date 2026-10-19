# TemariHub — Product Requirements Document (PRD)

**Project:** TemariHub  
**Tagline:** Discover opportunities. Build your future. (ዕድሎችን ያግኙ። የወደፊትዎን ይገንቡ።)  
**Version:** 1.0 — Full-Stack MVP  
**Target Audience:** Ethiopian university students in STEM/Technology, recent graduates, opportunity submitters, and platform administrators.  
**Pilot Focus:** Adama Science and Technology University (ASTU), with multi-university configurable support (AAU, AAiT, BDU, Hawassa, Jimma, etc.).  
**Languages:** English (Primary), Amharic (Secondary).  

---

## 1. Executive Summary & Problem Statement

Ethiopian higher education institutions graduate tens of thousands of STEM students each year. However, access to legitimate internships, junior developer roles, hackathons, graduate scholarships, research fellowships, and technical training opportunities remains severely fragmented:
- **Scattered Information:** Opportunities are haphazardly shared across informal Telegram channels, Facebook groups, and university notice boards.
- **Verification & Fraud Risks:** Students frequently encounter expired links, unverified listings, or fraudulent schemes without recourse.
- **Application Disorganization:** Students lack a unified, private dashboard to monitor application deadlines, requirements, and progress.
- **Language Inclusivity:** While STEM education in Ethiopia is conducted in English, navigation, support guidance, and localization in Amharic dramatically enhance accessibility and user confidence.

**TemariHub** bridges this gap by delivering a centralized, trustworthy, bilingual web application that aggregates verified opportunities, tracks student applications securely, and provides transparent moderation workflows.

---

## 2. User Personas

### 2.1. The STEM Student / Graduate (e.g., "Kidus", 3rd-year Software Engineering at ASTU)
- **Goals:** Find verified summer internships and local/remote tech opportunities; keep track of submission deadlines and status in one place.
- **Pain Points:** Misses deadlines because notifications get buried in Telegram chats; wastes time applying to expired listings.
- **Needs:** Fast search with filters (by university level, required skills, work arrangement), bookmarking, a private application tracker with status stages and notes, and bilingual UI.

### 2.2. The Opportunity Submitter (e.g., "Bethlehem", Tech Recruiter or Club Leader)
- **Goals:** Reach qualified Ethiopian STEM talent for hackathons, internships, or fellowships.
- **Pain Points:** Overwhelmed with unqualified applicants or lacking a dedicated platform beyond social media.
- **Needs:** Structured submission form requiring verification URLs, eligibility requirements, and deadlines; visibility into review status.

### 2.3. The Platform Administrator (e.g., "Abebe", University Opportunity Coordinator)
- **Goals:** Maintain high trust and data integrity on TemariHub.
- **Needs:** Dedicated moderation queue to inspect original source URLs, approve/reject submissions with notes, manage reports, monitor audit logs, and trigger listing expiration.

---

## 3. Product Scope & MVP Feature Matrix

| Feature Module | In MVP Scope (v1.0) | Explicitly Deferred |
|---|---|---|
| **Authentication** | Email & password registration, login, logout, session management, secure cookies, role-based access (Student, Submitter, Admin). | Social OAuth (Google/GitHub), SMS/phone OTP login. |
| **Profile Management** | Student university, degree level, field of study, skills, location preferences, bio. | AI resume parsing, automated skill assessment badges. |
| **Opportunity Discovery** | Search (title, org, description, skills), multifaceted filters (category, field, level, location, arrangement), sorting, pagination, verified badge, detail view with original source URL. | Automatic web scrapers, unstructured crawler bots. |
| **Student Tracker** | 7 statuses (*Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*), applied date, private notes, deadline warnings. | Direct one-click application submission to third-party ATS, automated email sync. |
| **Saved Listings** | Save/unsave opportunities, duplicate prevention, quick dashboard widget. | Shared/public bookmark lists. |
| **Opportunity Submission**| Submitter portal: organization info, eligibility criteria, deadline, original source URL, draft/review status. | Paid priority listings, employer subscription billing. |
| **Moderation & Trust** | Admin review queue, approve/reject with feedback, listing expiration, user reporting system, audit trail. | Automated AI-based fraud detection. |
| **Localization** | Dynamic English/Amharic switcher, persistent language state, full UI dictionary (navigation, forms, buttons, alerts). | Real-time machine translation of user-generated listings. |

---

## 4. Detailed Functional Requirements

### 4.1. Authentication & User Management
- **FR-AUTH-01:** Students and submitters can register using a unique email address, password, full name, and chosen role.
- **FR-AUTH-02:** Passwords must meet minimum complexity (min 8 characters, combination of letters and numbers) and be hashed using bcrypt/Argon2.
- **FR-AUTH-03:** Administrator accounts **cannot** be created through public registration. Initial admin seeded via secure environment variables or migration script.
- **FR-AUTH-04:** Authentication must utilize secure, HTTP-only, SameSite cookies with session protection.
- **FR-AUTH-05:** Protected routes must enforce authentication and role-based permissions (RBAC) both on client routes and API endpoints.

### 4.2. Student Profiles & Preferences
- **FR-PROF-01:** Students can configure and update their academic profile:
  - University: Pre-populated list of Ethiopian universities (ASTU, AAU/AAiT, BDU, Hawassa, Jimma, Haramaya, etc.) with custom "Other" option.
  - Degree Level: Undergraduate (BSc), Postgraduate (MSc), PhD, TVET/Diploma, Recent Graduate.
  - Field of Study: Computer Science, Software Engineering, Electrical & Computer Engineering, Mechanical, Civil, Information Systems, Data Science, etc.
  - Technical Skills: Tag-based selection (e.g., Python, React, Java, Docker, Machine Learning, UI/UX).
  - Work Arrangement Preferences: Remote, On-site (Addis Ababa, Adama, Hawassa, etc.), Hybrid.
- **FR-PROF-02:** Private student profiles and private notes must never be accessible to other students or unauthenticated public requests.

### 4.3. Opportunity Discovery & Exploration
- **FR-OPP-01:** Feed displays only `published` and `approved` opportunities that have not expired.
- **FR-OPP-02:** Text search across title, organization name, description, and required skills.
- **FR-OPP-03:** Multi-select filtering:
  - Opportunity Type: `internship`, `entry_level_job`, `scholarship`, `hackathon`, `fellowship`, `training`.
  - Work Arrangement: `on_site`, `remote`, `hybrid`.
  - Eligible Education Levels and Fields of Study.
  - Location (City / Region in Ethiopia or International).
- **FR-OPP-04:** Sorting by `publicationDate` (newest first) or `deadline` (closing soonest).
- **FR-OPP-05:** Opportunity Detail View displays:
  - Organization name, logo/avatar, verified status.
  - Full description and eligibility criteria.
  - Deadline countdown and status (`Open`, `Closing Soon`, `Expired`).
  - Compensation details (if unpaid, stipended, or salary specified).
  - Clickable external application URL and original source verification URL.
  - Report button for suspicious or inaccurate listings.

### 4.4. Student Application Tracker & Bookmarking
- **FR-TRK-01:** Students can save/bookmark opportunities with a single click. Duplicate saves are prevented.
- **FR-TRK-02:** Students can add an opportunity to their Application Tracker with one of seven defined stages:
  1. *Interested* (ፍላጎት አለኝ)
  2. *Preparing* (በመዘጋጀት ላይ)
  3. *Applied* (አመልክቻለሁ)
  4. *Interview* (ቃለ-መጠይቅ)
  5. *Accepted* (ተቀባይነት አግኝቷል)
  6. *Rejected* (ያልተሳካ)
  7. *Withdrawn* (የተሰረዘ)
- **FR-TRK-03:** Students can edit tracker entry to record `appliedDate` and markdown/text `privateNotes`.
- **FR-TRK-04:** Dashboard displays summary cards: Total Saved, Applications in Progress, Upcoming Deadlines (< 7 days), and Recent Activity.
- **FR-TRK-05:** Clear user disclaimer: *Marking an application as "Applied" tracks personal progress on TemariHub and does not constitute submission to the external organization.*

### 4.5. Opportunity Submission & Moderation Workflow
- **FR-MOD-01:** Submitters can enter listing data: Title, Org Name, Category, Eligibility, Skills, Locations, Deadline, Application URL, Source URL, and contact email.
- **FR-MOD-02:** Newly submitted listings are automatically assigned `moderationStatus: "pending"` and `publicationStatus: "draft"`. They are invisible in public feeds.
- **FR-MOD-03:** Admin moderation dashboard enables:
  - Reviewing the queue of pending submissions.
  - Inspecting original source URL and application URL.
  - Approving (transitions to `approved` and `published`) or Rejecting with rejection reasons.
  - Manually expiring or archiving outdated listings.
- **FR-MOD-04:** Automated expiration rule: Listings past their deadline are marked `expired` and hidden from the active feed by default, with an option for users to toggle viewing past opportunities for reference.
- **FR-MOD-05:** User report mechanism allows students to report fraudulent, expired, or duplicate opportunities with a categorization reason. Admins can review and resolve reports.
- **FR-MOD-06:** Audit log automatically records key administrative actions (Approvals, Rejections, Edits, Deletions) with admin ID, timestamp, and action details.

### 4.6. Internationalization & Localization (i18n)
- **FR-I18N-01:** Platform supports English (`en`) as default and Amharic (`am`) as secondary language.
- **FR-I18N-02:** Language toggle accessible on top navigation bar across all screen sizes.
- **FR-I18N-03:** Selected language preference persists in local storage and user session.
- **FR-I18N-04:** Complete dictionary coverage for navigation, buttons, forms, labels, error states, and tracker stages.
- **FR-I18N-05:** Date formats displayed accurately and timezone context aligned with East Africa Time (EAT, UTC+3 / `Africa/Addis_Ababa`).

---

## 5. Non-Functional Requirements

- **NFR-PERF:** Opportunity search and feed response time < 200ms with indexed queries; frontend initial load < 1.5s on 3G/4G connections typical in Ethiopian universities.
- **NFR-SEC:** OWASP Top 10 compliance: CSRF tokens, strict CORS, rate-limiting on authentication and submission endpoints, parameter validation with Zod, sanitized output against XSS.
- **NFR-ACC:** WCAG 2.1 Level AA compliance: high contrast, keyboard navigable, responsive down to 320px mobile screens.
- **NFR-REL:** MongoDB data integrity with Mongoose schema constraints, compound unique indexes on relations, and graceful error handling.
