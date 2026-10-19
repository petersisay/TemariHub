import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ExternalLink } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { adminService } from '../services/adminService';
import { Opportunity } from '../types';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ModerationModal } from '../components/admin/ModerationModal';

export const ModerationQueuePage: React.FC = () => {
  const { t } = useTranslation();
  const [queue, setQueue] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingOpp, setInspectingOpp] = useState<Opportunity | null>(null);

  const loadQueue = async () => {
    setIsLoading(true);
    const data = await adminService.getModerationQueue();
    setQueue(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (
    opportunityId: string,
    decision: 'approve' | 'reject',
    notes: string
  ) => {
    await adminService.decideModeration(opportunityId, decision, notes);
    await loadQueue();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-brand-600" />
          <span>{t('admin.moderationQueue')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review community submissions, inspect original source URLs, and publish verified
          opportunities.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading pending submissions..." />
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-slate-800">{t('admin.emptyQueue')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('admin.table.title')}</th>
                  <th className="px-4 py-3">{t('admin.table.type')}</th>
                  <th className="px-4 py-3">{t('admin.table.source')}</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-right">{t('admin.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block">{opp.title}</span>
                      <span className="text-[11px] text-slate-500">{opp.organization.name}</span>
                    </td>
                    <td className="px-4 py-3.5 capitalize">
                      {opp.opportunityType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate">
                      <a
                        href={opp.originalSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <span className="truncate">{opp.originalSourceUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {new Date(opp.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setInspectingOpp(opp)}
                      >
                        Review & Decide
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ModerationModal
        isOpen={!!inspectingOpp}
        onClose={() => setInspectingOpp(null)}
        opportunity={inspectingOpp}
        onDecision={handleDecision}
      />
    </div>
  );
};
