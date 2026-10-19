import React, { useState, useEffect } from 'react';
import { Bookmark, Compass } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { trackerService } from '../services/trackerService';
import { SavedOpportunityItem } from '../types';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const SavedOpportunitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [savedItems, setSavedItems] = useState<SavedOpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSaved = async () => {
    setIsLoading(true);
    const data = await trackerService.getSavedOpportunities();
    setSavedItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleSaveToggle = (opp: any, saved: boolean) => {
    if (!saved) {
      setSavedItems((prev) => prev.filter((item) => item.opportunityId !== opp.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bookmark className="w-7 h-7 text-amber-500 fill-amber-500" />
          <span>{t('nav.saved')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review opportunities you've bookmarked for future consideration.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading saved listings..." />
      ) : savedItems.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-brand-600" />}
          title="No saved opportunities yet"
          description="Browse published opportunities and click the bookmark icon to save them for easy reference."
          actionText="Browse Opportunities"
          onAction={() => window.location.assign('/opportunities')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => (
            <OpportunityCard
              key={item.id}
              opportunity={item.opportunity}
              initialSaved={true}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
