import { Opportunity, OpportunityReport, AuditLogItem } from '../types';
import { ApiClient } from './api';

export const adminService = {
  /**
   * Fetches the queue of pending opportunity listings awaiting moderation.
   */
  async getModerationQueue(): Promise<Opportunity[]> {
    try {
      const response = await ApiClient.request<Opportunity[]>('/admin/moderation/queue');
      return response.data || [];
    } catch (err) {
      console.warn('API /admin/moderation/queue request error:', err);
      return [];
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
      console.warn('API /admin/reports request error:', err);
      return [];
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
      console.warn('API /admin/audit-logs request error:', err);
      return [];
    }
  },

  /**
   * Retrieves opportunities awaiting verification review.
   */
  async getVerificationQueue(status?: string): Promise<Opportunity[]> {
    try {
      const url = status
        ? `/admin/opportunities/verification-queue?status=${status}`
        : '/admin/opportunities/verification-queue';
      const response = await ApiClient.request<Opportunity[]>(url);
      return response.data || [];
    } catch (err) {
      console.warn('API getVerificationQueue unavailable:', err);
      return [];
    }
  },

  /**
   * Decides verification status (VERIFIED, REJECTED, NEEDS_RECHECK) with evidence.
   */
  async decideVerification(
    opportunityId: string,
    status: 'VERIFIED' | 'REJECTED' | 'NEEDS_RECHECK',
    evidenceNotes?: string
  ): Promise<Opportunity> {
    try {
      const response = await ApiClient.request<Opportunity>(
        `/admin/opportunities/${opportunityId}/verify`,
        {
          method: 'POST',
          body: JSON.stringify({ status, evidenceNotes }),
        }
      );
      return response.data;
    } catch (err) {
      console.warn('API decideVerification failed:', err);
      throw err;
    }
  },

  /**
   * Retrieves material changes detected by source monitoring.
   */
  async getChangeHistory(): Promise<any[]> {
    try {
      const response = await ApiClient.request<any[]>('/admin/opportunities/change-history');
      return response.data || [];
    } catch (err) {
      console.warn('API getChangeHistory unavailable:', err);
      return [];
    }
  },

  /**
   * Retrieves registry of trusted opportunity sources.
   */
  async getTrustedSources(): Promise<any[]> {
    try {
      const response = await ApiClient.request<any[]>('/sources');
      return response.data || [];
    } catch (err) {
      console.warn('API /sources unavailable:', err);
      return [];
    }
  },

  /**
   * Triggers an immediate source check for a single source.
   */
  async triggerSourceCheck(sourceId: string): Promise<any> {
    const response = await ApiClient.request(`/sources/${sourceId}/check`, {
      method: 'POST',
    });
    return response.data;
  },

  /**
   * Triggers immediate monitoring run across all approved sources.
   */
  async checkAllSources(): Promise<any> {
    const response = await ApiClient.request('/sources/check-all', {
      method: 'POST',
    });
    return response.data;
  },

  /**
   * Registers a new trusted source.
   */
  async createTrustedSource(sourceData: any): Promise<any> {
    const response = await ApiClient.request('/sources', {
      method: 'POST',
      body: JSON.stringify(sourceData),
    });
    return response.data;
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
