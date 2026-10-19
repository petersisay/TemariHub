import mongoose from 'mongoose';
import { ApplicationTracker, IApplicationTracker, TrackerStatus } from '../../models/ApplicationTracker.js';
import { Opportunity } from '../../models/Opportunity.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.js';

export class TrackerService {
  /**
   * Retrieves all applications tracked by the authenticated student.
   * Populates the referenced opportunity document.
   */
  static async getTrackerItems(userId: string): Promise<any[]> {
    const items = await ApplicationTracker.find({ userId })
      .populate('opportunityId')
      .sort({ updatedAt: -1 });

    return items
      .filter((item) => item.opportunityId != null)
      .map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        opportunityId: (item.opportunityId as any)._id?.toString() || item.opportunityId.toString(),
        opportunity: item.opportunityId,
        status: item.status,
        appliedDate: item.appliedDate ? item.appliedDate.toISOString() : undefined,
        deadlineReminderDate: item.deadlineReminderDate ? item.deadlineReminderDate.toISOString() : undefined,
        privateNotes: item.privateNotes,
        updatedAt: item.updatedAt.toISOString(),
      }));
  }

  /**
   * Calculates dashboard summary statistics and upcoming deadlines for the student.
   */
  static async getTrackerStats(userId: string): Promise<any> {
    const items = await ApplicationTracker.find({ userId }).populate('opportunityId');

    const validItems = items.filter((i) => i.opportunityId != null);
    const total = validItems.length;

    const byStatus: Record<TrackerStatus, number> = {
      Interested: 0,
      Preparing: 0,
      Applied: 0,
      Interview: 0,
      Accepted: 0,
      Rejected: 0,
      Withdrawn: 0,
    };

    validItems.forEach((item) => {
      if (byStatus[item.status] !== undefined) {
        byStatus[item.status]++;
      }
    });

    const activeApplications = byStatus.Preparing + byStatus.Applied + byStatus.Interview;
    const acceptedCount = byStatus.Accepted;

    // Upcoming deadlines for tracked items
    const now = new Date();
    const upcomingDeadlines = validItems
      .filter((item) => {
        const opp = item.opportunityId as any;
        return opp && opp.deadline && new Date(opp.deadline) >= now;
      })
      .map((item) => ({
        trackerId: item._id.toString(),
        opportunityId: (item.opportunityId as any)._id.toString(),
        title: (item.opportunityId as any).title,
        organizationName: (item.opportunityId as any).organization?.name,
        deadline: (item.opportunityId as any).deadline,
        status: item.status,
      }))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    return {
      total,
      byStatus,
      activeApplications,
      acceptedCount,
      upcomingDeadlines,
    };
  }

  /**
   * Adds an opportunity to the student's personal application tracker.
   * If already tracked, updates existing entry's status without creating duplicate records.
   */
  static async addToTracker(
    userId: string,
    data: {
      opportunityId: string;
      status?: TrackerStatus;
      appliedDate?: string;
      deadlineReminderDate?: string;
      privateNotes?: string;
    }
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(data.opportunityId)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const opportunity = await Opportunity.findById(data.opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const existing = await ApplicationTracker.findOne({
      userId,
      opportunityId: data.opportunityId,
    });

    if (existing) {
      if (data.status) existing.status = data.status;
      if (data.appliedDate) existing.appliedDate = new Date(data.appliedDate);
      if (data.deadlineReminderDate) existing.deadlineReminderDate = new Date(data.deadlineReminderDate);
      if (data.privateNotes !== undefined) existing.privateNotes = data.privateNotes;
      await existing.save();

      return {
        id: existing._id.toString(),
        userId: existing.userId.toString(),
        opportunityId: existing.opportunityId.toString(),
        opportunity,
        status: existing.status,
        appliedDate: existing.appliedDate ? existing.appliedDate.toISOString() : undefined,
        deadlineReminderDate: existing.deadlineReminderDate ? existing.deadlineReminderDate.toISOString() : undefined,
        privateNotes: existing.privateNotes,
        updatedAt: existing.updatedAt.toISOString(),
      };
    }

    const newDoc = await ApplicationTracker.create({
      userId,
      opportunityId: data.opportunityId,
      status: data.status || 'Interested',
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
      deadlineReminderDate: data.deadlineReminderDate ? new Date(data.deadlineReminderDate) : undefined,
      privateNotes: data.privateNotes,
    });

    return {
      id: newDoc._id.toString(),
      userId: newDoc.userId.toString(),
      opportunityId: newDoc.opportunityId.toString(),
      opportunity,
      status: newDoc.status,
      appliedDate: newDoc.appliedDate ? newDoc.appliedDate.toISOString() : undefined,
      deadlineReminderDate: newDoc.deadlineReminderDate ? newDoc.deadlineReminderDate.toISOString() : undefined,
      privateNotes: newDoc.privateNotes,
      updatedAt: newDoc.updatedAt.toISOString(),
    };
  }

  /**
   * Updates a tracker entry.
   * STRICT SECURITY BOUNDARY: Enforces server-side ownership. Students cannot edit other students' tracker entries.
   */
  static async updateTrackerItem(
    trackerId: string,
    userId: string,
    data: {
      status?: TrackerStatus;
      appliedDate?: string | null;
      deadlineReminderDate?: string | null;
      privateNotes?: string;
    }
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(trackerId)) {
      throw new BadRequestError('Invalid tracker item ID');
    }

    const item = await ApplicationTracker.findById(trackerId);
    if (!item) {
      throw new NotFoundError('Application tracker item not found');
    }

    // Server-side ownership verification
    if (item.userId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to modify this tracking entry.');
    }

    if (data.status) {
      item.status = data.status;
    }
    if (data.appliedDate !== undefined) {
      item.appliedDate = data.appliedDate ? new Date(data.appliedDate) : undefined;
    }
    if (data.deadlineReminderDate !== undefined) {
      item.deadlineReminderDate = data.deadlineReminderDate ? new Date(data.deadlineReminderDate) : undefined;
    }
    if (data.privateNotes !== undefined) {
      item.privateNotes = data.privateNotes;
    }

    await item.save();
    const populated = await ApplicationTracker.findById(trackerId).populate('opportunityId');

    return {
      id: populated!._id.toString(),
      userId: populated!.userId.toString(),
      opportunityId: (populated!.opportunityId as any)._id?.toString() || populated!.opportunityId.toString(),
      opportunity: populated!.opportunityId,
      status: populated!.status,
      appliedDate: populated!.appliedDate ? populated!.appliedDate.toISOString() : undefined,
      deadlineReminderDate: populated!.deadlineReminderDate ? populated!.deadlineReminderDate.toISOString() : undefined,
      privateNotes: populated!.privateNotes,
      updatedAt: populated!.updatedAt.toISOString(),
    };
  }

  /**
   * Deletes a tracker entry with strict ownership check.
   */
  static async deleteTrackerItem(trackerId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(trackerId)) {
      throw new BadRequestError('Invalid tracker item ID');
    }

    const item = await ApplicationTracker.findById(trackerId);
    if (!item) {
      throw new NotFoundError('Application tracker item not found');
    }

    if (item.userId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to delete this tracking entry.');
    }

    await ApplicationTracker.findByIdAndDelete(trackerId);
  }
}
