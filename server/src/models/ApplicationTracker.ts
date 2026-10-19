import mongoose, { Document, Schema, Types } from 'mongoose';

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
  userId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  status: TrackerStatus;
  appliedDate?: Date;
  deadlineReminderDate?: Date;
  privateNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationTrackerSchema = new Schema<IApplicationTracker>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'Interested',
        'Preparing',
        'Applied',
        'Interview',
        'Accepted',
        'Rejected',
        'Withdrawn',
      ],
      default: 'Interested',
      required: true,
    },
    appliedDate: {
      type: Date,
    },
    deadlineReminderDate: {
      type: Date,
    },
    privateNotes: {
      type: String,
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
      trim: true,
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

// Prevent duplicate tracker entries for same student & opportunity
ApplicationTrackerSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
ApplicationTrackerSchema.index({ userId: 1, status: 1 });
ApplicationTrackerSchema.index({ userId: 1, updatedAt: -1 });

export const ApplicationTracker = mongoose.model<IApplicationTracker>(
  'ApplicationTracker',
  ApplicationTrackerSchema
);
