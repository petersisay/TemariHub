import mongoose from 'mongoose';
import { Opportunity, IOpportunity, VerificationStatus } from '../../models/Opportunity.js';
import { OpportunityReport, IOpportunityReport } from '../../models/OpportunityReport.js';
import { TrustedSource } from '../../models/TrustedSource.js';
import { AuditLog, IAuditLog } from '../../models/AuditLog.js';
import { User, IUser } from '../../models/User.js';
import { ApplicationTracker } from '../../models/ApplicationTracker.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class AdminService {
  /**
   * Retrieves all opportunities currently awaiting moderation.
   */
  static async getModerationQueue(): Promise<IOpportunity[]> {
    return Opportunity.find({ moderationStatus: 'pending' })
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: 1 });
  }

  /**
   * Approves or rejects a submitted opportunity.
   * Records an immutable event in the audit trail.
   */
  static async decideModeration(
    opportunityId: string,
    decision: 'approve' | 'reject',
    reviewNotes: string | undefined,
    adminUser: IUser
  ): Promise<IOpportunity> {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const now = new Date();

    if (decision === 'approve') {
      opportunity.moderationStatus = 'approved';
      opportunity.publicationStatus = 'published';
      opportunity.reviewedBy = adminUser._id;
      opportunity.reviewNotes = reviewNotes;
      opportunity.publicationDate = now;
      opportunity.lastVerifiedDate = now;
      opportunity.sourceNotes = reviewNotes || 'Source verified by administrator.';
    } else {
      opportunity.moderationStatus = 'rejected';
      opportunity.publicationStatus = 'draft';
      opportunity.reviewedBy = adminUser._id;
      opportunity.reviewNotes = reviewNotes;
      opportunity.sourceNotes = reviewNotes || 'Submission rejected by moderation.';
    }

    await opportunity.save();

    // Append-only audit record
    await AuditLog.create({
      actorId: adminUser._id,
      action: decision === 'approve' ? 'opportunity_approve' : 'opportunity_reject',
      targetType: 'opportunity',
      targetId: opportunity._id,
      ipAddress: '127.0.0.1',
      userAgent: 'TemariHub Admin Console',
      metadata: {
        opportunityTitle: opportunity.title,
        decision,
        reviewNotes: reviewNotes || '',
      },
      timestamp: now,
    });

    return opportunity;
  }

  /**
   * Retrieves opportunity reports submitted by users.
   */
  static async getReports(statusFilter?: string): Promise<any[]> {
    const filter = statusFilter ? { status: statusFilter } : {};
    const reports = await OpportunityReport.find(filter)
      .populate('opportunityId', 'title slug organization deadline')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    return reports.map((r) => ({
      id: r._id.toString(),
      opportunityId: (r.opportunityId as any)?._id?.toString() || r.opportunityId?.toString(),
      opportunityTitle: (r.opportunityId as any)?.title || 'Unknown Opportunity',
      reportedBy: (r.reportedBy as any)?.name || 'Anonymous User',
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      resolutionNotes: r.resolutionNotes,
    }));
  }

  /**
   * Resolves or dismisses a community report.
   */
  static async resolveReport(
    reportId: string,
    status: 'reviewed' | 'resolved' | 'dismissed',
    resolutionNotes: string | undefined,
    adminUser: IUser
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new BadRequestError('Invalid report ID');
    }

    const report = await OpportunityReport.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    report.status = status;
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = adminUser._id;
    await report.save();

    await AuditLog.create({
      actorId: adminUser._id,
      action: 'report_resolve',
      targetType: 'report',
      targetId: report._id,
      ipAddress: '127.0.0.1',
      userAgent: 'TemariHub Admin Console',
      metadata: {
        status,
        resolutionNotes: resolutionNotes || '',
      },
      timestamp: new Date(),
    });

    return report;
  }

  /**
   * Retrieves recent audit logs for system transparency.
   */
  static async getAuditLogs(limit: number = 50): Promise<any[]> {
    const logs = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit);

    return logs.map((log) => ({
      id: log._id.toString(),
      actorId: (log.actorId as any)?._id?.toString() || log.actorId?.toString(),
      actorName: (log.actorId as any)?.name || 'System / CLI',
      actorRole: (log.actorId as any)?.role || 'admin',
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId.toString(),
      targetTitle: (log.metadata as any)?.opportunityTitle || undefined,
      timestamp: log.timestamp.toISOString(),
      metadata: log.metadata,
    }));
  }

  /**
   * Retrieves opportunities grouped or filtered by verification status.
   */
  static async getVerificationQueue(statusFilter?: string): Promise<IOpportunity[]> {
    const filter: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      filter.verificationStatus = statusFilter;
    } else if (!statusFilter) {
      filter.verificationStatus = { $in: ['PENDING_REVIEW', 'NEEDS_RECHECK'] };
    }

    return Opportunity.find(filter)
      .populate('submittedBy', 'name email role')
      .populate('trustedSourceId', 'name category officialUrl monitoringStatus')
      .sort({ createdAt: -1 });
  }

  /**
   * Administrator decides on opportunity verification (VERIFIED, REJECTED, NEEDS_RECHECK).
   */
  static async decideVerification(
    opportunityId: string,
    status: VerificationStatus,
    evidenceNotes: string | undefined,
    adminUser: IUser
  ): Promise<IOpportunity> {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const now = new Date();
    const oldStatus = opportunity.verificationStatus;

    opportunity.verificationStatus = status;
    opportunity.reviewedBy = adminUser._id;
    opportunity.reviewNotes = evidenceNotes;
    opportunity.lastVerifiedDate = now;
    opportunity.lastCheckedDate = now;

    if (evidenceNotes) {
      opportunity.verificationEvidence = evidenceNotes;
    }

    if (status === 'VERIFIED') {
      opportunity.moderationStatus = 'approved';
      opportunity.publicationStatus = 'published';
      opportunity.publicationDate = opportunity.publicationDate || now;
    } else if (status === 'REJECTED') {
      opportunity.moderationStatus = 'rejected';
      opportunity.publicationStatus = 'draft';
    } else if (status === 'NEEDS_RECHECK') {
      opportunity.moderationStatus = 'pending';
    }

    opportunity.changeHistory.push({
      date: now,
      fieldChanged: 'verificationStatus',
      oldValue: oldStatus,
      newValue: status,
      reason: evidenceNotes || `Admin moderation decision: ${status}`,
    });

    await opportunity.save();

    await AuditLog.create({
      actorId: adminUser._id,
      action: status === 'VERIFIED' ? 'opportunity_approve' : 'opportunity_reject',
      targetType: 'opportunity',
      targetId: opportunity._id,
      ipAddress: '127.0.0.1',
      userAgent: 'TemariHub Admin Console',
      metadata: {
        opportunityTitle: opportunity.title,
        oldStatus,
        newStatus: status,
        evidenceNotes: evidenceNotes || '',
      },
      timestamp: now,
    });

    return opportunity;
  }

  /**
   * Retrieves material updates detected by continuous source monitoring.
   */
  static async getMaterialChangeHistory(limit: number = 50): Promise<any[]> {
    const opps = await Opportunity.find({
      $or: [
        { isMateriallyUpdated: true },
        { 'changeHistory.0': { $exists: true } },
      ],
    })
      .select('title slug organization changeHistory lastCheckedDate verificationStatus')
      .sort({ updatedAt: -1 })
      .limit(limit);

    const flatHistory: any[] = [];
    for (const opp of opps) {
      for (const item of opp.changeHistory) {
        flatHistory.push({
          opportunityId: opp._id.toString(),
          opportunityTitle: opp.title,
          organizationName: opp.organization?.name,
          date: item.date,
          fieldChanged: item.fieldChanged,
          oldValue: item.oldValue,
          newValue: item.newValue,
          reason: item.reason,
          sourceEvidence: item.sourceEvidence,
          verificationStatus: opp.verificationStatus,
        });
      }
    }

    return flatHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Aggregates platform-wide metrics for the administrator dashboard.
   */
  static async getPlatformStats(): Promise<any> {
    const [
      publishedOpportunities,
      pendingModeration,
      totalStudents,
      totalSubmitters,
      totalTracked,
      pendingReports,
      verifiedCount,
      pendingVerificationCount,
      needsRecheckCount,
      expiredCount,
      totalSources,
      healthySources,
      failingSources,
    ] = await Promise.all([
      Opportunity.countDocuments({ publicationStatus: 'published', moderationStatus: 'approved' }),
      Opportunity.countDocuments({ moderationStatus: 'pending' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'submitter' }),
      ApplicationTracker.countDocuments(),
      OpportunityReport.countDocuments({ status: 'pending' }),
      Opportunity.countDocuments({ verificationStatus: 'VERIFIED' }),
      Opportunity.countDocuments({ verificationStatus: 'PENDING_REVIEW' }),
      Opportunity.countDocuments({ verificationStatus: 'NEEDS_RECHECK' }),
      Opportunity.countDocuments({ verificationStatus: 'EXPIRED' }),
      TrustedSource.countDocuments(),
      TrustedSource.countDocuments({ monitoringStatus: 'healthy' }),
      TrustedSource.countDocuments({ monitoringStatus: 'failing' }),
    ]);

    return {
      publishedOpportunities,
      pendingModeration,
      totalStudents,
      totalSubmitters,
      totalTracked,
      pendingReports,
      totalVerified: verifiedCount,
      pendingVerification: pendingVerificationCount,
      needsRecheck: needsRecheckCount,
      expired: expiredCount,
      totalSources,
      healthySources,
      failingSources,
    };
  }
}
