export type UserRole = 'student' | 'submitter' | 'admin';

export interface UserPreferences {
  deadlineAlerts?: boolean;
  reviewAlerts?: boolean;
  language?: 'en' | 'am';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  customAvatarUrl?: string;
  googleAvatarUrl?: string;
  hasCustomAvatar?: boolean;
  preferences?: UserPreferences;
}

export type OpportunityType =
  | 'internship'
  | 'entry_level_job'
  | 'scholarship'
  | 'hackathon'
  | 'fellowship'
  | 'training';

export type WorkArrangement = 'on_site' | 'remote' | 'hybrid';

export type DegreeLevel =
  | 'undergraduate'
  | 'postgraduate'
  | 'phd'
  | 'tvet'
  | 'recent_graduate';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type PublicationStatus = 'draft' | 'published' | 'expired' | 'archived';

export type VerificationStatus =
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NEEDS_RECHECK';

export interface ChangeHistoryItem {
  date: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  reason: string;
  sourceEvidence?: string;
}

export interface TrustedSource {
  id: string;
  name: string;
  slug: string;
  officialUrl: string;
  category: 'university' | 'corporate' | 'government' | 'international_org' | 'scholarship_portal' | 'tech_community';
  verificationStatus: 'approved' | 'pending_review' | 'disabled';
  monitoringMethod: 'official_api' | 'rss_feed' | 'permitted_monitoring' | 'manual_review';
  monitoringStatus: 'healthy' | 'failing' | 'idle' | 'not_configured';
  lastSuccessfulCheck?: string;
  lastDiscoveredOpportunityTime?: string;
  lastErrorMessage?: string;
  notes?: string;
  opportunitiesDiscoveredCount: number;
}

export interface Compensation {
  type: 'paid' | 'unpaid' | 'stipend' | 'competitive' | 'undisclosed';
  amount?: number;
  currency?: 'ETB' | 'USD';
  period?: 'monthly' | 'total' | 'hourly';
}

export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  organization: {
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
    isVerified: boolean;
  };
  opportunityType: OpportunityType;
  description: string;
  eligibleFields: string[];
  eligibleLevels: DegreeLevel[];
  requiredSkills: string[];
  location: string;
  workArrangement: WorkArrangement;
  deadline: string; // ISO date string
  isRollingDeadline: boolean;
  compensation: Compensation;
  originalSourceUrl: string;
  applicationUrl: string;
  sourceNotes?: string;
  moderationStatus: ModerationStatus;
  publicationStatus: PublicationStatus;
  verificationStatus?: VerificationStatus;
  trustedSourceId?: string;
  sourceName?: string;
  sourceType?: string;
  verificationEvidence?: string;
  lastCheckedDate?: string;
  isMateriallyUpdated?: boolean;
  changeHistory?: ChangeHistoryItem[];
  lastVerifiedDate: string;
  publicationDate: string;
  submittedBy?: string;
  viewsCount: number;
  savesCount: number;
  reportCount?: number;
}

export type TrackerStatus =
  | 'Interested'
  | 'Preparing'
  | 'Applied'
  | 'Interview'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface ApplicationTrackerItem {
  id: string;
  userId: string;
  opportunityId: string;
  opportunity: Opportunity;
  status: TrackerStatus;
  appliedDate?: string;
  deadlineReminderDate?: string;
  privateNotes?: string;
  updatedAt: string;
}

export interface SavedOpportunityItem {
  id: string;
  userId: string;
  opportunityId: string;
  opportunity: Opportunity;
  savedAt: string;
}

export interface StudentProfile {
  userId: string;
  university: string;
  customUniversity?: string;
  degreeLevel: DegreeLevel;
  fieldOfStudy: string;
  graduationYear: number;
  skills: string[];
  preferredLocations: string[];
  preferredArrangements: WorkArrangement[];
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export type ReportReason =
  | 'expired'
  | 'inaccurate_info'
  | 'suspicious_scam'
  | 'broken_link'
  | 'duplicate'
  | 'other';

export interface OpportunityReport {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  reportedBy: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: 'opportunity_approve' | 'opportunity_reject' | 'opportunity_expire' | 'opportunity_delete' | 'report_resolve';
  targetType: 'opportunity' | 'report' | 'user';
  targetId: string;
  targetTitle?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface OpportunityFilterParams {
  search?: string;
  types?: OpportunityType[];
  arrangements?: WorkArrangement[];
  levels?: DegreeLevel[];
  field?: string;
  location?: string;
  locationScope?: 'ethiopia' | 'remote' | 'international';
  sortBy?: 'newest' | 'deadline_asc' | 'deadline_desc';
  includeExpired?: boolean;
  page?: number;
  limit?: number;
}
