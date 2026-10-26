# TemariHub — Database Schema & Data Model Specification

**Database:** MongoDB  
**Object Data Modeling (ODM):** Mongoose (TypeScript)  
**Encoding:** UTF-8 (Full Unicode support for Amharic script)  
**Production Cluster:** MongoDB Atlas  

---

## 1. Entity Relationship Diagram (Conceptual)

```
       +--------------------+
       |        User        |
       |  (Auth & Identity) |
       +---------+----------+
                 |
        1:1      | 1:N
   +-------------+--------------+-------------------+------------------+
   |                            |                   |                  |
   v                            v                   v                  v
+--------------------+  +---------------+  +-------------------+  +---------------+
|   StudentProfile   |  | Opportunity   |  |   TrustedSource   |  | AuditLog      |
|  (Academic Meta)   |  | (Submissions) |  |   (12 Monitors)   |  | (Admin trail) |
+--------------------+  +-------+-------+  +-------------------+  +---------------+
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
Stores core identity, Google OAuth attributes, username, custom avatars, and preferences.

```typescript
export type UserRole = 'student' | 'submitter' | 'admin';
export type AuthProviderType = 'local' | 'google';

export interface IUserPreferences {
  deadlineAlerts: boolean;
  reviewAlerts: boolean;
  language: 'en' | 'am';
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  id?: string;
  name: string;
  fullName?: string;
  username?: string; // 3-30 chars, lowercase alphanumeric, unique
  email: string;     // Unique, lowercase, indexed
  passwordHash?: string; // Optional (Google-only authentication)
  googleId?: string;     // Unique sparse index from Google Identity Services
  authProvider: AuthProviderType; // 'local' | 'google'
  role: UserRole;        // 'student' | 'submitter' | 'admin'
  isVerified: boolean;
  avatarUrl?: string;
  customAvatarUrl?: string;
  googleAvatarUrl?: string;
  hasCustomAvatar?: boolean;
  bio?: string;
  institution?: string;
  preferences?: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ email: 1 }` (unique)
  - `{ googleId: 1 }` (unique, sparse)
  - `{ username: 1 }` (unique, sparse)
  - `{ role: 1 }`
- **Self-Healing Hook:** Obsolete or unneeded legacy indexes (such as `sessionTokenHash_1`) are automatically pruned at server startup to prevent duplicate key collisions.

---

### 2.2. TrustedSource Schema (`trustedsources`)
Represents the 12 curated Ethiopian and global institutions monitored for authentic student opportunities.

```typescript
export type SourceCategory =
  | 'university'
  | 'corporate'
  | 'government'
  | 'international_org'
  | 'scholarship_portal'
  | 'tech_community';

export type SourceVerificationStatus = 'approved' | 'pending_review' | 'disabled';
export type MonitoringMethod = 'official_api' | 'rss_feed' | 'permitted_monitoring' | 'manual_review';
export type MonitoringHealth = 'healthy' | 'failing' | 'idle' | 'not_configured';

export interface ITrustedSource extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string; // unique slug
  officialUrl: string;
  category: SourceCategory;
  verificationStatus: SourceVerificationStatus;
  monitoringMethod: MonitoringMethod;
  monitoringConfig?: {
    feedUrl?: string;
    endpointUrl?: string;
    checkIntervalHours?: number;
    customHeaders?: Record<string, string>;
  };
  lastSuccessfulCheck?: Date;
  lastDiscoveredOpportunityTime?: Date;
  monitoringStatus: MonitoringHealth;
  lastErrorMessage?: string;
  failureCount: number;
  approvedBy?: Types.ObjectId; // References User (Admin)
  notes?: string;
  opportunitiesDiscoveredCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ slug: 1 }` (unique)
  - `{ verificationStatus: 1, monitoringStatus: 1 }`
  - `{ category: 1 }`

---

### 2.3. Opportunity Schema (`opportunities`)
The central entity for discovery, filtering, verification, and application tracking.

```typescript
export type OpportunityType =
  | 'internship'
  | 'entry_level_job'
  | 'scholarship'
  | 'hackathon'
  | 'fellowship'
  | 'training';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type PublicationStatus = 'draft' | 'published' | 'expired' | 'archived';
export type VerificationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'NEEDS_RECHECK';
export type SourceType = 'official_portal' | 'verified_partner' | 'manual_submission' | 'automated_feed';

export interface IChangeHistoryItem {
  date: Date;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  reason: string;
  sourceEvidence?: string;
}

export interface ICompensation {
  type: 'paid' | 'unpaid' | 'stipend' | 'competitive' | 'undisclosed';
  amount?: number;
  currency?: 'ETB' | 'USD';
  period?: 'monthly' | 'total' | 'hourly';
}

export interface IOpportunity extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string; // unique slug
  organization: {
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
    isVerified: boolean;
  };
  organizationId?: Types.ObjectId;
  opportunityType: OpportunityType;
  description: string;
  eligibleFields: string[];
  eligibleLevels: DegreeLevel[];
  requiredSkills: string[];
  location: string;
  workArrangement: WorkArrangement;
  deadline: Date;
  isRollingDeadline: boolean;
  compensation: ICompensation;
  originalSourceUrl: string; // Mandatory link to original source
  applicationUrl: string;    // Official application link
  sourceNotes?: string;
  moderationStatus: ModerationStatus;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  trustedSourceId?: Types.ObjectId; // References TrustedSource
  sourceName?: string;
  sourceType: SourceType;
  verificationEvidence?: string;
  lastCheckedDate: Date;
  isMateriallyUpdated: boolean;
  changeHistory: IChangeHistoryItem[];
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
  - Public Feed compound index: `{ publicationStatus: 1, verificationStatus: 1, deadline: 1 }`
  - Filter compound index: `{ opportunityType: 1, workArrangement: 1, publicationStatus: 1, verificationStatus: 1 }`
  - Submitter index: `{ submittedBy: 1, createdAt: -1 }`
  - Verification Queue index: `{ verificationStatus: 1, createdAt: -1 }`
  - Slug index: `{ slug: 1 }` (unique)

---

### 2.4. StudentProfile Schema (`student_profiles`)
Stores academic context, skills, and preferences for student accounts.

```typescript
export interface IStudentProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // References User, unique 1:1
  university: string;     // e.g., "ASTU", "AAU / AAiT", "BDU", "Hawassa", "Other"
  customUniversity?: string;
  degreeLevel: 'undergraduate' | 'postgraduate' | 'phd' | 'tvet' | 'recent_graduate';
  fieldOfStudy: string;   // e.g., "Software Engineering", "Computer Science"
  graduationYear?: number;
  skills: string[];       // e.g., ["React", "Python", "Docker"]
  preferredLocations: string[];
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

### 2.5. SavedOpportunity Schema (`saved_opportunities`)
Allows students to bookmark opportunities for quick review.

```typescript
export interface ISavedOpportunity extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // References User (Student)
  opportunityId: Types.ObjectId; // References Opportunity
  createdAt: Date;
}
```
- **Compound Unique Index:**
  - `{ userId: 1, opportunityId: 1 }` (prevents duplicate saves)

---

### 2.6. ApplicationTracker Schema (`application_trackers`)
Enables students to privately track their application journey through 7 distinct stages.

```typescript
export type TrackerStatus =
  | 'Interested'
  | 'Preparing'
  | 'Applied'
  | 'Interview'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface IApplicationTracker extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;        // References User (Student)
  opportunityId: Types.ObjectId; // References Opportunity
  status: TrackerStatus;
  appliedDate?: Date;
  deadlineReminderDate?: Date;
  privateNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Compound Unique Index:**
  - `{ userId: 1, opportunityId: 1 }` (ensures 1 tracker record per student-opportunity pair)
- **Privacy Boundary:** Accessible exclusively by `req.user._id === tracker.userId`.

---

### 2.7. OpportunityReport Schema (`opportunity_reports`)
Enables community reporting of broken links, scams, or expired listings.

```typescript
export interface IOpportunityReport extends Document {
  _id: Types.ObjectId;
  opportunityId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: 'expired' | 'inaccurate_info' | 'suspicious_scam' | 'broken_link' | 'duplicate' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolvedBy?: Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Indexes:**
  - `{ status: 1, createdAt: -1 }`
  - `{ opportunityId: 1 }`

---

### 2.8. AuditLog Schema (`audit_logs`)
Provides an immutable record of sensitive administrative, verification, and moderation actions.

```typescript
export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId; // Admin or system user who performed the action
  action:
    | 'opportunity_approve'
    | 'opportunity_reject'
    | 'opportunity_verify'
    | 'opportunity_expire'
    | 'opportunity_delete'
    | 'source_scan'
    | 'report_resolve'
    | 'user_role_change'
    | 'admin_provisioned';
  targetType: 'opportunity' | 'report' | 'user' | 'source';
  targetId: Types.ObjectId;
  metadata?: Record<string, any>;
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

| Environment | Database Target | Purpose & Lifecycle |
|---|---|---|
| **Automated Testing** | `mongodb-memory-server` | Dedicated strictly to isolated integration tests (`Supertest`). Spun up ephemerally in-memory, cleaned between test suites, and destroyed upon completion. |
| **Local Development** | Local MongoDB (`mongodb://localhost:27017/temarihub`) or Development Atlas Cluster | Persistent development storage for developer testing, fixture data, and manual end-to-end verification. |
| **Production** | MongoDB Atlas (Replica Set with TLS & IP allowlisting) | High-availability production database with encrypted storage, automated daily backups, and restricted access. |
