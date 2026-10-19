import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISavedOpportunity extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  createdAt: Date;
}

const SavedOpportunitySchema = new Schema<ISavedOpportunity>(
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Prevent duplicate bookmarks for same student & opportunity
SavedOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
SavedOpportunitySchema.index({ userId: 1, createdAt: -1 });

export const SavedOpportunity = mongoose.model<ISavedOpportunity>(
  'SavedOpportunity',
  SavedOpportunitySchema
);
