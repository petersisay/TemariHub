import mongoose, { Document, Schema, Types } from 'mongoose';

export type AuditAction =
  | 'opportunity_approve'
  | 'opportunity_reject'
  | 'opportunity_expire'
  | 'opportunity_delete'
  | 'report_resolve'
  | 'user_role_change'
  | 'admin_provisioned';

export type AuditTargetType = 'opportunity' | 'report' | 'user';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: Types.ObjectId;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'opportunity_approve',
        'opportunity_reject',
        'opportunity_expire',
        'opportunity_delete',
        'report_resolve',
        'user_role_change',
        'admin_provisioned',
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['opportunity', 'report', 'user'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
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

AuditLogSchema.index({ targetId: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
