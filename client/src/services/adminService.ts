import { Opportunity, OpportunityReport, AuditLogItem } from '../types';
import { ApiClient } from './api';
import {
  INITIAL_FIXTURE_OPPORTUNITIES,
  INITIAL_FIXTURE_REPORTS,
  INITIAL_FIXTURE_AUDIT_LOGS,
} from './fixtures';

export const adminService = {
  /**
   * Fetches the queue of pending opportunity listings awaiting moderation.
   */
  async getModerationQueue(): Promise<Opportunity[]> {
    try {
      const response = await ApiClient.request<Opportunity[]>('/admin/moderation/queue');
      return response.data || [];
    } catch (err) {
      console.warn('API /admin/moderation/queue unavailable, local fallback:', err);
      return INITIAL_FIXTURE_OPPORTUNITIES.filter(
        (opp) => opp.moderationStatus === 'pending'
      );
    }
  },

  /**
   * Submits an administrative approval or rejection decision with review feedback.
   */
  async decideModeration(
    opportunityId: string,
    decision: 'approve' | 'reject',
    reviewNotes?: string
  ): Promise<Opportunity> {
    try {
      const response = await ApiClient.request<Opportunity>(
        `/admin/moderation/${opportunityId}/decision`,
        {
          method: 'PUT',
          body: JSON.stringify({ decision, reviewNotes }),
        }
      );
      return response.data;
    } catch (err) {
      console.warn('API decideModeration failed:', err);
      throw err;
    }
  },

  /**
   * Fetches community reports flagged by students or submitters.
   */
  async getReports(): Promise<OpportunityReport[]> {
    try {
      const response = await ApiClient.request<OpportunityReport[]>('/admin/reports');
      return response.data || [];
    } catch (err) {
      console.warn('API /admin/reports unavailable, local fallback:', err);
      return [...INITIAL_FIXTURE_REPORTS];
    }
  },

  /**
   * Resolves or dismisses a reported listing.
   */
  async resolveReport(reportId: string, resolutionNotes?: string): Promise<void> {
    try {
      await ApiClient.request(`/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'resolved',
          resolutionNotes: resolutionNotes || 'Resolved by administrator.',
        }),
      });
    } catch (err) {
      console.warn('API resolveReport failed:', err);
      throw err;
    }
  },

  /**
   * Retrieves append-only audit trail records.
   */
  async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const response = await ApiClient.request<AuditLogItem[]>('/admin/audit-logs');
      return response.data || [];
    } catch (err) {
      console.warn('API /admin/audit-logs unavailable, local fallback:', err);
      return [...INITIAL_FIXTURE_AUDIT_LOGS];
    }
  },

  /**
   * Retrieves aggregate platform statistics.
   */
  async getStats(): Promise<any> {
    try {
      const response = await ApiClient.request('/admin/stats');
      return response.data;
    } catch (err) {
      console.warn('API /admin/stats unavailable:', err);
      return null;
    }
  },

  async getAdminStats(): Promise<any> {
    return this.getStats();
  },
};
