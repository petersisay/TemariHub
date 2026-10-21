import mongoose, { Document, Schema, Types } from 'mongoose';
import { DegreeLevel, WorkArrangement } from './StudentProfile.js';

export type OpportunityType =
  | 'internship'
  | 'entry_level_job'
  | 'scholarship'
  | 'hackathon'
  | 'fellowship'
  | 'training';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type PublicationStatus = 'draft' | 'published' | 'expired' | 'archived';

export type VerificationStatus =
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NEEDS_RECHECK';

export type SourceType =
  | 'official_portal'
  | 'verified_partner'
  | 'manual_submission'
  | 'automated_feed';

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
  slug: string;
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
  originalSourceUrl: string;
  applicationUrl: string;
  sourceNotes?: string;
  moderationStatus: ModerationStatus;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  trustedSourceId?: Types.ObjectId;
  sourceName?: string;
  sourceType: SourceType;
  verificationEvidence?: string;
  lastCheckedDate: Date;
  isMateriallyUpdated: boolean;
  changeHistory: IChangeHistoryItem[];
  reviewedBy?: Types.ObjectId;
  reviewNotes?: string;
  lastVerifiedDate: Date;
  publicationDate?: Date;
  submittedBy: Types.ObjectId;
  viewsCount: number;
  savesCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompensationSchema = new Schema<ICompensation>(
  {
    type: {
      type: String,
      enum: ['paid', 'unpaid', 'stipend', 'competitive', 'undisclosed'],
      default: 'undisclosed',
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['ETB', 'USD'],
      default: 'ETB',
    },
    period: {
      type: String,
      enum: ['monthly', 'total', 'hourly'],
      default: 'monthly',
    },
  },
  { _id: false }
);

const OpportunitySchema = new Schema<IOpportunity>(
  {
    title: {
      type: String,
      required: [true, 'Opportunity title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    organization: {
      name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
      },
      logoUrl: { type: String, trim: true },
      websiteUrl: { type: String, trim: true },
      isVerified: { type: Boolean, default: false },
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    opportunityType: {
      type: String,
      enum: [
        'internship',
        'entry_level_job',
        'scholarship',
        'hackathon',
        'fellowship',
        'training',
      ],
      required: [true, 'Opportunity type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    eligibleFields: {
      type: [String],
      default: [],
    },
    eligibleLevels: {
      type: [String],
      enum: ['undergraduate', 'postgraduate', 'phd', 'tvet', 'recent_graduate'],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    workArrangement: {
      type: String,
      enum: ['on_site', 'remote', 'hybrid'],
      required: true,
      default: 'on_site',
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline date is required'],
    },
    isRollingDeadline: {
      type: Boolean,
      default: false,
    },
    compensation: {
      type: CompensationSchema,
      default: () => ({ type: 'undisclosed' }),
    },
    originalSourceUrl: {
      type: String,
      required: [true, 'Original source URL is required for verification'],
      trim: true,
    },
    applicationUrl: {
      type: String,
      required: [true, 'Direct application URL is required'],
      trim: true,
    },
    sourceNotes: {
      type: String,
      trim: true,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    publicationStatus: {
      type: String,
      enum: ['draft', 'published', 'expired', 'archived'],
      default: 'draft',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'NEEDS_RECHECK'],
      default: 'PENDING_REVIEW',
    },
    trustedSourceId: {
      type: Schema.Types.ObjectId,
      ref: 'TrustedSource',
    },
    sourceName: {
      type: String,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['official_portal', 'verified_partner', 'manual_submission', 'automated_feed'],
      default: 'official_portal',
    },
    verificationEvidence: {
      type: String,
      trim: true,
    },
    lastCheckedDate: {
      type: Date,
      default: Date.now,
    },
    isMateriallyUpdated: {
      type: Boolean,
      default: false,
    },
    changeHistory: [
      {
        date: { type: Date, default: Date.now },
        fieldChanged: { type: String, required: true },
        oldValue: { type: String, required: true },
        newValue: { type: String, required: true },
        reason: { type: String, required: true },
        sourceEvidence: { type: String },
      },
    ],
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    lastVerifiedDate: {
      type: Date,
      default: Date.now,
    },
    publicationDate: {
      type: Date,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    savesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        (ret as any).id = ret._id.toString();
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

OpportunitySchema.pre('save', function (next) {
  // Synchronize moderationStatus and verificationStatus
  if (this.isModified('verificationStatus')) {
    if (this.verificationStatus === 'VERIFIED') {
      this.moderationStatus = 'approved';
      if (this.publicationStatus === 'draft') {
        this.publicationStatus = 'published';
      }
    } else if (this.verificationStatus === 'REJECTED') {
      this.moderationStatus = 'rejected';
      this.publicationStatus = 'draft';
    } else if (this.verificationStatus === 'EXPIRED') {
      this.publicationStatus = 'expired';
    } else if (this.verificationStatus === 'PENDING_REVIEW' || this.verificationStatus === 'NEEDS_RECHECK') {
      this.moderationStatus = 'pending';
    }
  } else if (this.isModified('moderationStatus')) {
    if (this.moderationStatus === 'approved' && this.verificationStatus !== 'VERIFIED') {
      this.verificationStatus = 'VERIFIED';
    } else if (this.moderationStatus === 'rejected' && this.verificationStatus !== 'REJECTED') {
      this.verificationStatus = 'REJECTED';
    } else if (this.moderationStatus === 'pending' && this.verificationStatus === 'VERIFIED') {
      this.verificationStatus = 'PENDING_REVIEW';
    }
  }
  next();
});

OpportunitySchema.index({
  title: 'text',
  description: 'text',
  'organization.name': 'text',
  requiredSkills: 'text',
});
OpportunitySchema.index({ publicationStatus: 1, moderationStatus: 1, deadline: 1 });
OpportunitySchema.index({ verificationStatus: 1, deadline: 1 });
OpportunitySchema.index({ trustedSourceId: 1 });
OpportunitySchema.index({ opportunityType: 1, workArrangement: 1, publicationStatus: 1 });
OpportunitySchema.index({ submittedBy: 1 });

export const Opportunity = mongoose.model<IOpportunity>(
  'Opportunity',
  OpportunitySchema
);
