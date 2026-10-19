import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportReason =
  | 'expired'
  | 'inaccurate_info'
  | 'suspicious_scam'
  | 'broken_link'
  | 'duplicate'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface IOpportunityReport extends Document {
  _id: Types.ObjectId;
  opportunityId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolvedBy?: Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunityReportSchema = new Schema<IOpportunityReport>(
  {
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'expired',
        'inaccurate_info',
        'suspicious_scam',
        'broken_link',
        'duplicate',
        'other',
      ],
      required: true,
    },
    details: {
      type: String,
      required: [true, 'Report details and evidence are required'],
      trim: true,
      maxlength: [2000, 'Details cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

OpportunityReportSchema.index({ status: 1, createdAt: -1 });
OpportunityReportSchema.index({ opportunityId: 1 });

export const OpportunityReport = mongoose.model<IOpportunityReport>(
  'OpportunityReport',
  OpportunityReportSchema
);
