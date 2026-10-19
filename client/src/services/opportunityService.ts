import { Opportunity, OpportunityFilterParams, ReportReason } from '../types';
import { ApiClient } from './api';
import { INITIAL_FIXTURE_OPPORTUNITIES } from './fixtures';

export const opportunityService = {
  /**
   * Fetches published opportunities from the backend with server-side filtering & pagination.
   */
  async getOpportunities(params: OpportunityFilterParams = {}): Promise<{
    items: Opportunity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();

    if (params.search && params.search.trim() !== '') {
      query.set('search', params.search.trim());
    }

    if (params.types && params.types.length > 0) {
      query.set('types', params.types.join(','));
    }

    if (params.arrangements && params.arrangements.length > 0) {
      query.set('arrangements', params.arrangements.join(','));
    }

    if (params.levels && params.levels.length > 0) {
      query.set('levels', params.levels.join(','));
    }

    if (params.field && params.field !== 'All Fields') {
      query.set('field', params.field);
    }

    if (params.location && params.location !== 'All Locations') {
      query.set('location', params.location);
    }

    if (params.includeExpired) {
      query.set('includeExpired', 'true');
    }

    if (params.sortBy) {
      query.set('sortBy', params.sortBy);
    }

    if (params.page) {
      query.set('page', String(params.page));
    }

    if (params.limit) {
      query.set('limit', String(params.limit));
    }

    const endpoint = `/opportunities${query.toString() ? `?${query.toString()}` : ''}`;

    try {
      const response = await ApiClient.request<{
        items: Opportunity[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
      }>(endpoint);

      return {
        items: response.data.items || [],
        total: response.data.total ?? 0,
        page: response.data.page ?? 1,
        totalPages: response.data.totalPages ?? 1,
      };
    } catch (err) {
      console.warn('Backend API unavailable, falling back to local dataset:', err);
      return this.getLocalFilteredOpportunities(params);
    }
  },

  /**
   * Retrieves an opportunity by unique ID or slug.
   */
  async getOpportunityById(idOrSlug: string): Promise<Opportunity | undefined> {
    try {
      const response = await ApiClient.request<Opportunity>(`/opportunities/${idOrSlug}`);
      return response.data;
    } catch (err) {
      console.warn(`Failed to fetch opportunity ${idOrSlug} from API:`, err);
      return INITIAL_FIXTURE_OPPORTUNITIES.find(
        (o) => o.id === idOrSlug || o.slug === idOrSlug
      );
    }
  },

  /**
   * Alias for compatibility with OpportunityDetailPage.
   */
  async getOpportunityByIdOrSlug(idOrSlug: string): Promise<Opportunity | undefined> {
    return this.getOpportunityById(idOrSlug);
  },

  /**
   * Submits a new opportunity listing into the moderation queue.
   */
  async createOpportunity(data: Partial<Opportunity>): Promise<Opportunity> {
    const response = await ApiClient.request<Opportunity>('/opportunities/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Alias for compatibility with SubmitOpportunityPage.
   */
  async submitOpportunity(data: Partial<Opportunity>): Promise<Opportunity> {
    return this.createOpportunity(data);
  },

  /**
   * Submits a user report regarding an opportunity.
   * Supports both 3-arg and 5-arg caller signatures for backwards compatibility.
   */
  async reportOpportunity(
    opportunityId: string,
    titleOrReason: string | ReportReason,
    reasonOrDetails?: ReportReason | string,
    details?: string,
    _reportedBy?: string
  ): Promise<void> {
    let finalReason: ReportReason = 'other';
    let finalDetails = '';

    if (details !== undefined && reasonOrDetails !== undefined) {
      // 5-arg form: (id, title, reason, details, reportedBy)
      finalReason = reasonOrDetails as ReportReason;
      finalDetails = details;
    } else if (typeof titleOrReason === 'string' && typeof reasonOrDetails === 'string') {
      // 3-arg form: (id, reason, details)
      finalReason = titleOrReason as ReportReason;
      finalDetails = reasonOrDetails;
    }

    await ApiClient.request(`/opportunities/${opportunityId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: finalReason, details: finalDetails }),
    });
  },

  /**
   * Offline fallback for unit tests and offline demonstration.
   */
  getLocalFilteredOpportunities(params: OpportunityFilterParams = {}) {
    let results = [...INITIAL_FIXTURE_OPPORTUNITIES];

    results = results.filter((opp) => {
      if (opp.moderationStatus !== 'approved' || opp.publicationStatus !== 'published') {
        if (!params.includeExpired || opp.publicationStatus !== 'expired') {
          return false;
        }
      }
      return true;
    });

    if (params.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase().trim();
      results = results.filter(
        (opp) =>
          opp.title.toLowerCase().includes(q) ||
          opp.organization.name.toLowerCase().includes(q) ||
          opp.description.toLowerCase().includes(q) ||
          opp.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (params.types && params.types.length > 0) {
      results = results.filter((opp) => params.types!.includes(opp.opportunityType));
    }

    if (params.arrangements && params.arrangements.length > 0) {
      results = results.filter((opp) => params.arrangements!.includes(opp.workArrangement));
    }

    const total = results.length;
    const page = params.page || 1;
    const limit = params.limit || 12;

    return {
      items: results.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },
};
