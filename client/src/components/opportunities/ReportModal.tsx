import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Opportunity, ReportReason } from '../../types';
import { useTranslation } from '../../context/I18nContext';
import { opportunityService } from '../../services/opportunityService';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  opportunity,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setIsSubmitting(true);
    try {
      await opportunityService.reportOpportunity(
        opportunity.id,
        opportunity.title,
        reason,
        details,
        user?.name || 'Anonymous Student'
      );
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('opportunity.report')}>
      {isSuccess ? (
        <div className="py-6 text-center space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-900">Thank you for reporting</h4>
          <p className="text-xs text-slate-500">
            Our moderation team will inspect this listing and verify the original source.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              TemariHub relies on verified sources. Reporting broken URLs, expired listings, or
              suspicious claims protects fellow Ethiopian students.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="broken_link">Broken or Inaccessible Application URL</option>
              <option value="expired">Opportunity Has Already Expired</option>
              <option value="inaccurate_info">Inaccurate Requirements or Eligibility</option>
              <option value="suspicious_scam">Suspicious Organization / Potential Scam</option>
              <option value="duplicate">Duplicate Listing</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Details & Evidence
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue (e.g., 'The registration link gives a 404 error as of today')..."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              disabled={!details.trim()}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
