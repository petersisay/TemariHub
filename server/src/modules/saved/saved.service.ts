import mongoose from 'mongoose';
import { SavedOpportunity, ISavedOpportunity } from '../../models/SavedOpportunity.js';
import { Opportunity } from '../../models/Opportunity.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class SavedService {
  /**
   * Retrieves all opportunities bookmarked by the student.
   * Populates the referenced opportunity document.
   */
  static async getSavedOpportunities(userId: string): Promise<any[]> {
    const saved = await SavedOpportunity.find({ userId })
      .populate('opportunityId')
      .sort({ createdAt: -1 });

    // Format to match frontend SavedOpportunityItem interface
    return saved
      .filter((item) => item.opportunityId != null)
      .map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        opportunityId: (item.opportunityId as any)._id?.toString() || item.opportunityId.toString(),
        opportunity: item.opportunityId,
        savedAt: item.createdAt.toISOString(),
      }));
  }

  /**
   * Saves an opportunity for the student.
   * Idempotent: If already saved, safely returns existing bookmark without error.
   */
  static async saveOpportunity(
    userId: string,
    opportunityId: string
  ): Promise<{ saved: boolean; item: any }> {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const existing = await SavedOpportunity.findOne({ userId, opportunityId });
    if (existing) {
      return {
        saved: true,
        item: {
          id: existing._id.toString(),
          userId: existing.userId.toString(),
          opportunityId: existing.opportunityId.toString(),
          opportunity,
          savedAt: existing.createdAt.toISOString(),
        },
      };
    }

    const savedDoc = await SavedOpportunity.create({
      userId,
      opportunityId,
    });

    await Opportunity.updateOne({ _id: opportunityId }, { $inc: { savesCount: 1 } });

    return {
      saved: true,
      item: {
        id: savedDoc._id.toString(),
        userId: savedDoc.userId.toString(),
        opportunityId: savedDoc.opportunityId.toString(),
        opportunity,
        savedAt: savedDoc.createdAt.toISOString(),
      },
    };
  }

  /**
   * Removes an opportunity bookmark for the student.
   */
  static async removeSavedOpportunity(
    userId: string,
    opportunityId: string
  ): Promise<{ saved: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const deleted = await SavedOpportunity.findOneAndDelete({ userId, opportunityId });
    if (deleted) {
      await Opportunity.updateOne(
        { _id: opportunityId, savesCount: { $gt: 0 } },
        { $inc: { savesCount: -1 } }
      );
    }

    return { saved: false };
  }

  /**
   * Checks whether a specific opportunity is bookmarked by the student.
   */
  static async isSaved(userId: string, opportunityId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      return false;
    }
    const count = await SavedOpportunity.countDocuments({ userId, opportunityId });
    return count > 0;
  }
}
