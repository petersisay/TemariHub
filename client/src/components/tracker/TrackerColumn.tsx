import React from 'react';
import { ApplicationTrackerItem, TrackerStatus } from '../../types';
import { TrackerCard } from './TrackerCard';
import { useTranslation } from '../../context/I18nContext';

interface TrackerColumnProps {
  status: TrackerStatus;
  items: ApplicationTrackerItem[];
  onEditNotes: (item: ApplicationTrackerItem) => void;
  onStatusChange: (item: ApplicationTrackerItem, newStatus: TrackerStatus) => void;
  onRemove: (trackerId: string) => void;
}

export const TrackerColumn: React.FC<TrackerColumnProps> = ({
  status,
  items,
  onEditNotes,
  onStatusChange,
  onRemove,
}) => {
  const { t } = useTranslation();

  const statusHeaderColors: Record<TrackerStatus, string> = {
    Interested: 'border-slate-300 text-slate-700 bg-slate-100',
    Preparing: 'border-blue-300 text-blue-700 bg-blue-50',
    Applied: 'border-indigo-300 text-indigo-700 bg-indigo-50',
    Interview: 'border-amber-300 text-amber-800 bg-amber-50',
    Accepted: 'border-emerald-300 text-emerald-800 bg-emerald-50',
    Rejected: 'border-rose-300 text-rose-800 bg-rose-50',
    Withdrawn: 'border-slate-200 text-slate-500 bg-slate-50',
  };

  return (
    <div className="flex flex-col w-72 sm:w-80 shrink-0 bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 max-h-[calc(100vh-14rem)]">
      {/* Column Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-3 ${statusHeaderColors[status]}`}
      >
        <span className="font-bold text-xs uppercase tracking-wider">
          {t(`tracker.status_${status}`)}
        </span>
        <span className="text-xs font-extrabold bg-white/80 px-2 py-0.5 rounded-full shadow-2xs">
          {items.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {items.length === 0 ? (
          <div className="text-center py-8 px-2 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No opportunities in this stage.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <TrackerCard
              key={item.id}
              item={item}
              onEditNotes={onEditNotes}
              onStatusChange={onStatusChange}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
};
