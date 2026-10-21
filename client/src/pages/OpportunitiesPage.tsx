import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { opportunityService } from '../services/opportunityService';
import { Opportunity, OpportunityFilterParams, OpportunityType, WorkArrangement } from '../types';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { OpportunityFilters } from '../components/opportunities/OpportunityFilters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

export const OpportunitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial filters from URL
  const initialSearch = searchParams.get('search') || '';
  const initialType = searchParams.get('type')
    ? (searchParams.get('type')!.split(',') as OpportunityType[])
    : undefined;
  const initialArrangement = searchParams.get('arrangement')
    ? (searchParams.get('arrangement')!.split(',') as WorkArrangement[])
    : undefined;
  const initialField = searchParams.get('field') || undefined;
  const initialSort = (searchParams.get('sort') as any) || 'newest';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialIncludeExpired = searchParams.get('includeExpired') === 'true';

  const [filters, setFilters] = useState<OpportunityFilterParams>({
    search: initialSearch,
    types: initialType,
    arrangements: initialArrangement,
    field: initialField,
    sortBy: initialSort,
    page: initialPage,
    includeExpired: initialIncludeExpired,
    limit: 9,
  });

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.types && filters.types.length > 0)
      params.set('type', filters.types.join(','));
    if (filters.arrangements && filters.arrangements.length > 0)
      params.set('arrangement', filters.arrangements.join(','));
    if (filters.field && filters.field !== 'All Fields')
      params.set('field', filters.field);
    if (filters.sortBy && filters.sortBy !== 'newest')
      params.set('sort', filters.sortBy);
    if (filters.page && filters.page > 1)
      params.set('page', filters.page.toString());
    if (filters.includeExpired)
      params.set('includeExpired', 'true');

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch opportunities
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    opportunityService.getOpportunities(filters).then((res) => {
      if (isMounted) {
        setOpportunities(res.items);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      types: undefined,
      arrangements: undefined,
      field: undefined,
      sortBy: 'newest',
      includeExpired: false,
      page: 1,
      limit: 9,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('nav.opportunities')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Explore verified internships, scholarships, fellowships, and tech jobs for Ethiopian
            STEM students.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 w-full bg-white rounded-xl border border-slate-200 px-3 py-2 flex items-center gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-brand-500"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by role, company, skills, or location..."
              className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setFilters((prev) => ({ ...prev, search: '', page: 1 }));
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Button type="submit" size="sm" variant="primary">
              Search
            </Button>
          </form>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <OpportunityFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleClearFilters}
          />
        </div>

        {/* Mobile Filter Modal / Drawer */}
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
            <div className="bg-white w-full max-w-xs h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <OpportunityFilters
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleClearFilters}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full mt-6"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Opportunity Results Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-200">
            <span>{t('filter.resultsFound', { count: totalCount })}</span>
            {filters.includeExpired && (
              <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                Including expired opportunities
              </span>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner message="Searching verified opportunities..." />
          ) : opportunities.length === 0 ? (
            <EmptyState
              title={t('opportunity.emptyVerified')}
              description={t('opportunity.emptyDescription')}
              actionText={searchInput || filters.types?.length || filters.field ? "Clear All Filters" : undefined}
              onAction={searchInput || filters.types?.length || filters.field ? handleClearFilters : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
                }
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-600 px-3">
                Page {filters.page || 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page || 1) >= totalPages}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                }
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
