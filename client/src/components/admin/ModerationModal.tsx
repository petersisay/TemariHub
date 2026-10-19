import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Opportunity } from '../../types';
import { useTranslation } from '../../context/I18nContext';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onDecision: (
    opportunityId: string,
    decision: 'approve' | 'reject',
    notes: string
  ) => Promise<void>;
}

export const ModerationModal: React.FC<ModerationModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onDecision,
}) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!opportunity) return null;

  const handleAction = async (decision: 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
      await onDecision(opportunity.id, decision, notes);
      setNotes('');
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Opportunity Submission"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Verification Overview */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900">{opportunity.title}</h4>
              <p className="text-slate-600 font-medium">{opportunity.organization.name}</p>
            </div>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
              Pending Moderation
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Type</span>
              <span className="font-semibold text-slate-700 capitalize">
                {opportunity.opportunityType.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Deadline</span>
              <span className="font-semibold text-slate-700">
                {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Source Check */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-2 text-blue-900">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Verification Criteria Checklist:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li>
              Original Source URL:{' '}
              <a
                href={opportunity.originalSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline font-medium inline-flex items-center gap-0.5"
              >
                Inspect Original Link <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              Application URL:{' '}
              <a
                href={opportunity.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline font-medium inline-flex items-center gap-0.5"
              >
                Inspect Portal <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Ensure no deceptive application fees or unverified third-party claims.</li>
          </ul>
        </div>

        {/* Description Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Submitted Description
          </label>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 max-h-32 overflow-y-auto leading-relaxed">
            {opportunity.description}
          </div>
        </div>

        {/* Moderation Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('admin.reviewNotes')}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('admin.reviewNotesPlaceholder')}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction('reject')}
              isLoading={isSubmitting}
            >
              {t('admin.reject')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction('approve')}
              isLoading={isSubmitting}
            >
              {t('admin.approve')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
