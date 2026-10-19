import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { ApplicationTrackerItem, TrackerStatus } from '../../types';
import { useTranslation } from '../../context/I18nContext';

interface TrackerCardProps {
  item: ApplicationTrackerItem;
  onEditNotes: (item: ApplicationTrackerItem) => void;
  onStatusChange: (item: ApplicationTrackerItem, newStatus: TrackerStatus) => void;
  onRemove: (trackerId: string) => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
  item,
  onEditNotes,
  onStatusChange,
  onRemove,
}) => {
  const { t } = useTranslation();

  const statuses: TrackerStatus[] = [
    'Interested',
    'Preparing',
    'Applied',
    'Interview',
    'Accepted',
    'Rejected',
    'Withdrawn',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm p-4 transition-all space-y-3 group">
      <div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <Link
            to={`/opportunities/${item.opportunity.slug}`}
            className="text-xs font-bold text-slate-900 hover:text-brand-600 line-clamp-2 leading-snug"
          >
            {item.opportunity.title}
          </Link>
          <Link
            to={`/opportunities/${item.opportunity.slug}`}
            className="text-slate-400 hover:text-brand-600 shrink-0 p-0.5"
            title="Open opportunity"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-[11px] font-medium text-slate-500 truncate">
          {item.opportunity.organization.name}
        </p>
      </div>

      {/* Applied Date if set */}
      {item.appliedDate && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>
            Applied:{' '}
            {new Date(item.appliedDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* Private Notes preview if present */}
      {item.privateNotes ? (
        <div
          onClick={() => onEditNotes(item)}
          className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-2 cursor-pointer hover:bg-amber-50 transition-colors"
          title="Click to edit private note"
        >
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-800 mb-0.5">
            <FileText className="w-3 h-3 text-amber-600" />
            <span>{t('tracker.privateNotes')}</span>
          </div>
          <p className="text-[11px] text-slate-700 line-clamp-2 italic">
            "{item.privateNotes}"
          </p>
        </div>
      ) : (
        <button
          onClick={() => onEditNotes(item)}
          className="w-full text-left text-[11px] text-slate-400 hover:text-brand-600 hover:bg-slate-50 p-1.5 rounded border border-dashed border-slate-200 flex items-center gap-1 transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          <span>+ Add private notes</span>
        </button>
      )}

      {/* Status Stage Switcher & Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item, e.target.value as TrackerStatus)}
          className="text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Change status"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {t(`tracker.status_${s}`)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditNotes(item)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="Edit notes & date"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Remove from tracker"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
