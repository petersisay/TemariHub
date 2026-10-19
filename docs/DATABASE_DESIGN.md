# TemariHub — Database Schema & Data Model Specification

**Database:** MongoDB  
**Object Data Modeling (ODM):** Mongoose (TypeScript)  
**Encoding:** UTF-8 (Full Unicode support for Amharic script)  

---

## 1. Entity Relationship Diagram (Conceptual)

```
       +--------------------+
       |        User        |
       |  (Auth & Identity) |
       +---------+----------+
                 |
        1:1      | 1:N
   +-------------+--------------+------------------+
   |                            |                  |
   v                            v                  v
+--------------------+  +---------------+  +---------------+
|   StudentProfile   |  | Opportunity   |  | AuditLog      |
|  (Academic Meta)   |  | (Submissions) |  | (Admin trail) |
+--------------------+  +-------+-------+  +---------------+
                                |
             +------------------+------------------+
             | 1:N                                 | 1:N
             v                                     v
   +--------------------+                +--------------------+
   |  SavedOpportunity  |                | ApplicationTracker |
   |  (Student Bookmk)  |                | (7 Status Stages)  |
   +--------------------+                +--------------------+
             |                                     |
             +------------------+------------------+
                                | N:1
                                v
                     +--------------------+
                     | OpportunityReport  |
                     | (Moderation/Flags) |
                     +--------------------+
```

---

## 2. Core Collections & Schemas

### 2.1. User Schema (`users`)
Stores core identity, credentials, role, and active status.

```typescript
interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string; // Lowercase, trimmed, unique index
  passwordHash: string; // Argon2id or bcrypt hash
  role: 'student' | 'submitter' | 'admin';
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ email: 1 }` (unique)
  - `{ role: 1 }`

---

### 2.2. StudentProfile Schema (`student_profiles`)
Stores academic context, skills, and preferences for student accounts.

```typescript
interface IStudentProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // References User, unique 1:1
  university: string; // e.g., "ASTU", "AAU / AAiT", "BDU", "Hawassa", "Other"
  customUniversity?: string;
  degreeLevel: 'undergraduate' | 'postgraduate' | 'phd' | 'tvet' | 'recent_graduate';
  fieldOfStudy: string; // e.g., "Software Engineering", "Computer Science"
  graduationYear?: number;
  skills: string[]; // e.g., ["React", "Python", "Docker"]
  preferredLocations: string[]; // e.g., ["Addis Ababa", "Adama", "Remote"]
  preferredArrangements: ('on_site' | 'remote' | 'hybrid')[];
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ userId: 1 }` (unique)
  - `{ university: 1 }`
  - `{ fieldOfStudy: 1 }`

---

### 2.3. Organization Schema (`organizations`)
Represents hiring companies, tech clubs, NGOs, or universities listing opportunities.

```typescript
interface IOrganization {
  _id: Types.ObjectId;
  name: string; // e.g., "Safaricom Ethiopia", "ASTU CSEC", "ALX Ethiopia"
  slug: string; // unique slug
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  isVerified: boolean; // Trust verification badge
  contactEmail: string;
  createdBy: Types.ObjectId; // References User
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ slug: 1 }` (unique)
  - `{ name: "text" }`

---

### 2.4. Opportunity Schema (`opportunities`)
The central entity for discovery, filtering, and application tracking.

```typescript
interface IOpportunity {
  _id: Types.ObjectId;
  title: string; // e.g., "Junior Frontend Developer Intern"
  slug: string; // unique slug
  organization: {
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
    isVerified: boolean;
  };
  organizationId?: Types.ObjectId; // Optional ref to Organization collection
  opportunityType: 'internship' | 'entry_level_job' | 'scholarship' | 'hackathon' | 'fellowship' | 'training';
  description: string; // Detailed description & expectations
  eligibleFields: string[]; // ["Computer Science", "Software Engineering", "All STEM"]
  eligibleLevels: ('undergraduate' | 'postgraduate' | 'phd' | 'tvet' | 'recent_graduate')[];
  requiredSkills: string[]; // ["TypeScript", "React", "Node.js"]
  
  // Location & Work Arrangement
  location: string; // "Addis Ababa", "Adama", "Remote", etc.
  workArrangement: 'on_site' | 'remote' | 'hybrid';
  
  // Timing & Deadlines
  deadline: Date;
  isRollingDeadline: boolean;
  
  // Compensation
  compensation: {
    type: 'paid' | 'unpaid' | 'stipend' | 'competitive' | 'undisclosed';
    amount?: number;
    currency?: 'ETB' | 'USD';
    period?: 'monthly' | 'total' | 'hourly';
  };
  
  // Application & Source URLs
  originalSourceUrl: string; // Mandatory link to original source (proof of authenticity)
  applicationUrl: string;    // Direct URL to submit application
  sourceNotes?: string;      // Moderation notes on verification
  
  // Moderation & Lifecycle State
  moderationStatus: 'pending' | 'approved' | 'rejected';
  publicationStatus: 'draft' | 'published' | 'expired' | 'archived';
  reviewedBy?: Types.ObjectId; // References User (Admin)
  reviewNotes?: string;
  lastVerifiedDate: Date;
  publicationDate?: Date;
  
  submittedBy: Types.ObjectId; // References User
  viewsCount: number;
  savesCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - Full-text index: `{ title: "text", description: "text", "organization.name": "text", requiredSkills: "text" }`
  - Feed query compound index: `{ publicationStatus: 1, moderationStatus: 1, deadline: 1 }`
  - Filter compound index: `{ opportunityType: 1, workArrangement: 1, publicationStatus: 1 }`
  - Slug index: `{ slug: 1 }` (unique)

---

### 2.5. SavedOpportunity Schema (`saved_opportunities`)
Allows students to bookmark opportunities for quick review.

```typescript
interface ISavedOpportunity {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // References User (Student)
  opportunityId: Types.ObjectId; // References Opportunity
  createdAt: Date;
}
```
- **Unique Constraint:**
  - `{ userId: 1, opportunityId: 1 }` (unique compound index prevents duplicate saves)

---

### 2.6. ApplicationTracker Schema (`application_trackers`)
Enables students to privately track their application journey through 7 distinct stages.

```typescript
interface IApplicationTracker {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // References User (Student)
  opportunityId: Types.ObjectId; // References Opportunity
  status: 'Interested' | 'Preparing' | 'Applied' | 'Interview' | 'Accepted' | 'Rejected' | 'Withdrawn';
  appliedDate?: Date;
  deadlineReminderDate?: Date;
  privateNotes?: string; // Private student notes (interviews, checklist, contact info)
  createdAt: Date;
  updatedAt: Date;
}
```
- **Unique Constraint:**
  - `{ userId: 1, opportunityId: 1 }` (unique compound index ensures 1 tracker entry per student-opportunity pair)
- **Privacy Boundary:** Never exposed via public API endpoints. Available only to `req.user._id === tracker.userId`.

---

### 2.7. OpportunityReport Schema (`opportunity_reports`)
Enables community vigilance by reporting suspicious, expired, or inaccurate listings.

```typescript
interface IOpportunityReport {
  _id: Types.ObjectId;
  opportunityId: Types.ObjectId; // References Opportunity
  reportedBy: Types.ObjectId; // References User
  reason: 'expired' | 'inaccurate_info' | 'suspicious_scam' | 'broken_link' | 'duplicate' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolvedBy?: Types.ObjectId; // References User (Admin)
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ status: 1, createdAt: -1 }`
  - `{ opportunityId: 1 }`

---

### 2.8. Notification Schema (`notifications`)
User alerts for submission status, upcoming deadlines, and moderation feedback.

```typescript
interface INotification {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId; // References User
  title: string;
  message: string;
  type: 'submission_approved' | 'submission_rejected' | 'deadline_approaching' | 'system';
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
}
```
- **Indexes:**
  - `{ recipientId: 1, isRead: 1, createdAt: -1 }`

---

### 2.9. AuditLog Schema (`audit_logs`)
Provides an immutable record of sensitive administrative and moderation actions.

```typescript
interface IAuditLog {
  _id: Types.ObjectId;
  actorId: Types.ObjectId; // Admin user who performed the action
  action: 'opportunity_approve' | 'opportunity_reject' | 'opportunity_expire' | 'opportunity_delete' | 'report_resolve' | 'user_role_change';
  targetType: 'opportunity' | 'report' | 'user';
  targetId: Types.ObjectId;
  metadata?: Record<string, any>; // Diff or contextual metadata
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
```
- **Indexes:**
  - `{ targetId: 1, timestamp: -1 }`
  - `{ actorId: 1, timestamp: -1 }`
  - `{ timestamp: -1 }`

---

## 3. Database Environments & Connection Strategy

To maintain strict boundaries and data durability, database runtime environments are segregated as follows:

| Environment | Database Target | Purpose & Lifecycle |
|---|---|---|
| **Automated Testing** | `mongodb-memory-server` | Dedicated strictly to isolated integration tests (`Supertest`). Spun up ephemerally in-memory, cleaned between test suites, and destroyed upon completion. No test data touches persistent storage. |
| **Local Development** | Local MongoDB (`mongodb://localhost:27017/temarihub`) or Development Atlas Cluster | Dedicated to persistent development data so developer accounts, fixture opportunities, and manual testing states endure across server restarts. |
| **Staging & Production** | MongoDB Atlas (Replica Set with TLS & IP allowlisting) | High-availability production database with encrypted storage, automated backups, and restricted access via connection string. |
