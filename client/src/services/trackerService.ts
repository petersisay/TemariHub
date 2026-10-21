import {
  ApplicationTrackerItem,
  SavedOpportunityItem,
  TrackerStatus,
  Opportunity,
} from '../types';
import { ApiClient } from './api';

export const trackerService = {
  // ----------------------------------------------------
  // 1. Saved Opportunities (Bookmarks)
  // ----------------------------------------------------

  async getSavedOpportunities(): Promise<SavedOpportunityItem[]> {
    try {
      const response = await ApiClient.request<SavedOpportunityItem[]>('/saved-opportunities');
      return response.data || [];
    } catch (err) {
      console.warn('API /saved-opportunities request error:', err);
      return [];
    }
  },

  async isOpportunitySaved(opportunityId: string): Promise<boolean> {
    try {
      const response = await ApiClient.request<{ isSaved: boolean }>(
        `/saved-opportunities/${opportunityId}/status`
      );
      return response.data?.isSaved ?? false;
    } catch {
      const all = await this.getSavedOpportunities();
      return all.some((item) => item.opportunityId === opportunityId);
    }
  },

  async toggleSaveOpportunity(opportunity: Opportunity): Promise<{ saved: boolean }> {
    const isCurrentlySaved = await this.isOpportunitySaved(opportunity.id);

    try {
      if (isCurrentlySaved) {
        await ApiClient.request(`/saved-opportunities/${opportunity.id}`, {
          method: 'DELETE',
        });
        return { saved: false };
      } else {
        await ApiClient.request(`/saved-opportunities/${opportunity.id}`, {
          method: 'POST',
        });
        return { saved: true };
      }
    } catch (err) {
      console.warn('Backend bookmark toggle failed, local fallback:', err);
      return { saved: !isCurrentlySaved };
    }
  },

  // ----------------------------------------------------
  // 2. Application Tracker (7 Stages)
  // ----------------------------------------------------

  async getTrackerItems(): Promise<ApplicationTrackerItem[]> {
    try {
      const response = await ApiClient.request<ApplicationTrackerItem[]>('/tracker');
      return response.data || [];
    } catch (err) {
      console.warn('API /tracker request error:', err);
      return [];
    }
  },

  async getTrackerStats(): Promise<any> {
    try {
      const response = await ApiClient.request('/tracker/stats');
      return response.data;
    } catch (err) {
      console.warn('API /tracker/stats unavailable:', err);
      return null;
    }
  },

  async isOpportunityTracked(opportunityId: string): Promise<boolean> {
    const items = await this.getTrackerItems();
    return items.some((item) => item.opportunityId === opportunityId);
  },

  async addToTracker(
    opportunity: Opportunity,
    status: TrackerStatus = 'Interested',
    privateNotes?: string
  ): Promise<ApplicationTrackerItem> {
    try {
      const response = await ApiClient.request<ApplicationTrackerItem>('/tracker', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: opportunity.id,
          status,
          privateNotes,
        }),
      });
      return response.data;
    } catch (err) {
      console.warn('API /tracker POST failed, using local fallback:', err);
      return {
        id: `trk_${Date.now()}`,
        userId: 'current_user',
        opportunityId: opportunity.id,
        opportunity,
        status,
        privateNotes,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async updateTrackerStatus(
    trackerId: string,
    newStatus: TrackerStatus
  ): Promise<ApplicationTrackerItem> {
    return this.updateTrackerItem(trackerId, { status: newStatus });
  },

  async updateTrackerNotes(
    trackerId: string,
    privateNotes: string
  ): Promise<ApplicationTrackerItem> {
    return this.updateTrackerItem(trackerId, { privateNotes });
  },

  async updateTrackerItem(
    trackerId: string,
    updates: { status?: TrackerStatus; privateNotes?: string; appliedDate?: string }
  ): Promise<ApplicationTrackerItem> {
    try {
      const response = await ApiClient.request<ApplicationTrackerItem>(`/tracker/${trackerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.data;
    } catch (err) {
      console.warn('API /tracker update failed:', err);
      throw err;
    }
  },

  async removeFromTracker(trackerId: string): Promise<void> {
    try {
      await ApiClient.request(`/tracker/${trackerId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('API /tracker DELETE failed:', err);
    }
  },
};
