import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ApplicationTrackerItem, TrackerStatus } from '../../types';
import { useTranslation } from '../../context/I18nContext';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ApplicationTrackerItem | null;
  onSave: (
    trackerId: string,
    updates: { status?: TrackerStatus; privateNotes?: string; appliedDate?: string }
  ) => Promise<void>;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TrackerStatus>('Interested');
  const [notes, setNotes] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setNotes(item.privateNotes || '');
      setAppliedDate(
        item.appliedDate ? new Date(item.appliedDate).toISOString().split('T')[0] : ''
      );
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(item.id, {
        status,
        privateNotes: notes,
        appliedDate: appliedDate ? new Date(appliedDate).toISOString() : undefined,
      });
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

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
    <Modal isOpen={isOpen} onClose={onClose} title={t('tracker.editNotes')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
            Opportunity
          </span>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">
            {item.opportunity.title}
          </h4>
          <p className="text-xs text-slate-600">{item.opportunity.organization.name}</p>
        </div>

        {/* Status Stage Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('tracker.updateStatus')}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TrackerStatus)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(`tracker.status_${s}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Date Applied */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('tracker.appliedDate')}
          </label>
          <input
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Private Student Notes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              {t('tracker.privateNotes')}
            </label>
            <span className="text-[10px] text-teal-600 font-medium">100% Confidential</span>
          </div>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('tracker.notesPlaceholder')}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
            {t('tracker.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
