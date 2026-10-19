import { describe, it, expect, vi, beforeEach } from 'vitest';
import { opportunityService } from '../services/opportunityService';
import { trackerService } from '../services/trackerService';
import { adminService } from '../services/adminService';
import { ApiClient } from '../services/api';
import { INITIAL_FIXTURE_OPPORTUNITIES } from '../services/fixtures';

describe('Frontend API Integration & Service Wiring Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Opportunity Discovery Service Integration', () => {
    it('queries backend API for filtered opportunities with pagination', async () => {
      const mockResult = {
        success: true,
        data: {
          items: [INITIAL_FIXTURE_OPPORTUNITIES[0]],
          total: 1,
          page: 1,
          totalPages: 1,
          limit: 12,
        },
      };

      const requestSpy = vi.spyOn(ApiClient, 'request').mockResolvedValueOnce(mockResult as any);

      const result = await opportunityService.getOpportunities({
        search: 'Safaricom',
        types: ['internship'],
        location: 'Addis Ababa',
      });

      expect(requestSpy).toHaveBeenCalledTimes(1);
      const calledUrl = requestSpy.mock.calls[0][0];
      expect(calledUrl).toContain('/opportunities?');
      expect(calledUrl).toContain('search=Safaricom');
      expect(calledUrl).toContain('types=internship');
      expect(calledUrl).toContain('location=Addis+Ababa');

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe(INITIAL_FIXTURE_OPPORTUNITIES[0].title);
    });

    it('submits a new opportunity via POST /opportunities/submit', async () => {
      const sample = INITIAL_FIXTURE_OPPORTUNITIES[0];
      const requestSpy = vi.spyOn(ApiClient, 'request').mockResolvedValueOnce({
        success: true,
        data: sample,
      } as any);

      const created = await opportunityService.createOpportunity(sample);

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy.mock.calls[0][0]).toBe('/opportunities/submit');
      expect(requestSpy.mock.calls[0][1]?.method).toBe('POST');
      expect(created.id).toBe(sample.id);
    });

    it('submits an opportunity report via POST /opportunities/:id/report', async () => {
      const requestSpy = vi.spyOn(ApiClient, 'request').mockResolvedValueOnce({
        success: true,
      } as any);

      await opportunityService.reportOpportunity('opp_123', 'broken_link', 'Link gives 404');

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy.mock.calls[0][0]).toBe('/opportunities/opp_123/report');
      expect(requestSpy.mock.calls[0][1]?.method).toBe('POST');
      expect(requestSpy.mock.calls[0][1]?.body).toContain('broken_link');
    });
  });

  describe('2. Tracker & Bookmark Service Integration', () => {
    it('toggles bookmark save status via API client', async () => {
      // First call checks status (currently false)
      vi.spyOn(ApiClient, 'request')
        .mockResolvedValueOnce({ success: true, data: { isSaved: false } } as any)
        .mockResolvedValueOnce({ success: true, data: { saved: true } } as any);

      const res = await trackerService.toggleSaveOpportunity(INITIAL_FIXTURE_OPPORTUNITIES[0]);
      expect(res.saved).toBe(true);
    });

    it('adds an opportunity to the application tracker', async () => {
      const opp = INITIAL_FIXTURE_OPPORTUNITIES[0];
      const requestSpy = vi.spyOn(ApiClient, 'request').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'trk_123',
          opportunityId: opp.id,
          status: 'Preparing',
          opportunity: opp,
        },
      } as any);

      const tracked = await trackerService.addToTracker(opp, 'Preparing', 'Notes');
      expect(requestSpy).toHaveBeenCalledWith('/tracker', expect.objectContaining({
        method: 'POST',
      }));
      expect(tracked.status).toBe('Preparing');
    });
  });

  describe('3. Admin Moderation & Decision Service Integration', () => {
    it('calls PUT /admin/moderation/:id/decision to approve a listing', async () => {
      const opp = INITIAL_FIXTURE_OPPORTUNITIES[0];
      const requestSpy = vi.spyOn(ApiClient, 'request').mockResolvedValueOnce({
        success: true,
        data: { ...opp, moderationStatus: 'approved', publicationStatus: 'published' },
      } as any);

      const result = await adminService.decideModeration(opp.id, 'approve', 'Source link verified');

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy.mock.calls[0][0]).toBe(`/admin/moderation/${opp.id}/decision`);
      expect(requestSpy.mock.calls[0][1]?.method).toBe('PUT');
      expect(result.moderationStatus).toBe('approved');
    });

    it('resolves a report via PUT /admin/reports/:id/resolve', async () => {
      const requestSpy = vi.spyOn(ApiClient, 'request').mockResolvedValueOnce({
        success: true,
      } as any);

      await adminService.resolveReport('rep_123', 'Resolved with updated link');

      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy.mock.calls[0][0]).toBe('/admin/reports/rep_123/resolve');
      expect(requestSpy.mock.calls[0][1]?.method).toBe('PUT');
    });
  });
});
