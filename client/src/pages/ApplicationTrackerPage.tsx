import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Kanban, AlertCircle, PlusCircle } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { trackerService } from '../services/trackerService';
import { ApplicationTrackerItem, TrackerStatus } from '../types';
import { TrackerColumn } from '../components/tracker/TrackerColumn';
import { NotesModal } from '../components/tracker/NotesModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';

export const ApplicationTrackerPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApplicationTrackerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ApplicationTrackerItem | null>(null);

  const statuses: TrackerStatus[] = [
    'Interested',
    'Preparing',
    'Applied',
    'Interview',
    'Accepted',
    'Rejected',
    'Withdrawn',
  ];

  const loadItems = async () => {
    setIsLoading(true);
    const data = await trackerService.getTrackerItems();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleStatusChange = async (
    item: ApplicationTrackerItem,
    newStatus: TrackerStatus
  ) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t))
    );
    await trackerService.updateTrackerItem(item.id, { status: newStatus });
  };

  const handleSaveNotes = async (
    trackerId: string,
    updates: { status?: TrackerStatus; privateNotes?: string; appliedDate?: string }
  ) => {
    const updated = await trackerService.updateTrackerItem(trackerId, updates);
    setItems((prev) => prev.map((t) => (t.id === trackerId ? updated : t)));
  };

  const handleRemove = async (trackerId: string) => {
    setItems((prev) => prev.filter((t) => t.id !== trackerId));
    await trackerService.removeFromTracker(trackerId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Planning Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Kanban className="w-7 h-7 text-brand-600" />
            <span>{t('tracker.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('tracker.subtitle')}
          </p>
        </div>

        <Link to="/opportunities">
          <Button variant="outline" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            Find More Opportunities
          </Button>
        </Link>
      </div>

      {/* Prominent External Submission Disclaimer */}
      <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          {t('tracker.disclaimer')}
        </p>
      </div>

      {/* Tracker Kanban Board */}
      {isLoading ? (
        <LoadingSpinner message="Loading your application tracker board..." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
          {statuses.map((status) => {
            const columnItems = items.filter((i) => i.status === status);
            return (
              <TrackerColumn
                key={status}
                status={status}
                items={columnItems}
                onEditNotes={setEditingItem}
                onStatusChange={handleStatusChange}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      )}

      {/* Notes and Date Modal */}
      <NotesModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveNotes}
      />
    </div>
  );
};
