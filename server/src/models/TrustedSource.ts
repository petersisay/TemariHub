import mongoose, { Document, Schema, Types } from 'mongoose';

export type SourceCategory =
  | 'university'
  | 'corporate'
  | 'government'
  | 'international_org'
  | 'scholarship_portal'
  | 'tech_community';

export type SourceVerificationStatus = 'approved' | 'pending_review' | 'disabled';

export type MonitoringMethod =
  | 'official_api'
  | 'rss_feed'
  | 'permitted_monitoring'
  | 'manual_review';

export type MonitoringHealth = 'healthy' | 'failing' | 'idle' | 'not_configured';

export interface ITrustedSource extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
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
  approvedBy?: Types.ObjectId;
  notes?: string;
  opportunitiesDiscoveredCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrustedSourceSchema = new Schema<ITrustedSource>(
  {
    name: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    officialUrl: {
      type: String,
      required: [true, 'Official website or portal URL is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'university',
        'corporate',
        'government',
        'international_org',
        'scholarship_portal',
        'tech_community',
      ],
      required: [true, 'Source category is required'],
      default: 'university',
    },
    verificationStatus: {
      type: String,
      enum: ['approved', 'pending_review', 'disabled'],
      default: 'approved',
    },
    monitoringMethod: {
      type: String,
      enum: ['official_api', 'rss_feed', 'permitted_monitoring', 'manual_review'],
      default: 'manual_review',
    },
    monitoringConfig: {
      feedUrl: { type: String, trim: true },
      endpointUrl: { type: String, trim: true },
      checkIntervalHours: { type: Number, default: 24, min: 1 },
      customHeaders: { type: Map, of: String },
    },
    lastSuccessfulCheck: { type: Date },
    lastDiscoveredOpportunityTime: { type: Date },
    monitoringStatus: {
      type: String,
      enum: ['healthy', 'failing', 'idle', 'not_configured'],
      default: 'idle',
    },
    lastErrorMessage: { type: String, trim: true },
    failureCount: { type: Number, default: 0, min: 0 },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    opportunitiesDiscoveredCount: {
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

TrustedSourceSchema.index({ verificationStatus: 1, category: 1 });
TrustedSourceSchema.index({ monitoringMethod: 1, monitoringStatus: 1 });

export const TrustedSource = mongoose.model<ITrustedSource>(
  'TrustedSource',
  TrustedSourceSchema
);
