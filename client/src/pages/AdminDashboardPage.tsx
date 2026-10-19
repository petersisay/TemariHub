import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { adminService } from '../services/adminService';
import { Opportunity, OpportunityReport, AuditLogItem } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ModerationModal } from '../components/admin/ModerationModal';
import { AuditLogTable } from '../components/admin/AuditLogTable';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    activePublished: 0,
    openReports: 0,
    totalAudits: 0,
  });
  const [activeTab, setActiveTab] = useState<'moderation' | 'reports' | 'audit'>('moderation');
  const [pendingQueue, setPendingQueue] = useState<Opportunity[]>([]);
  const [reports, setReports] = useState<OpportunityReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingOpportunity, setInspectingOpportunity] = useState<Opportunity | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [statData, queueData, repData, logData] = await Promise.all([
      adminService.getAdminStats(),
      adminService.getModerationQueue(),
      adminService.getReports(),
      adminService.getAuditLogs(),
    ]);

    setStats(statData);
    setPendingQueue(queueData);
    setReports(repData);
    setAuditLogs(logData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModerationDecision = async (
    opportunityId: string,
    decision: 'approve' | 'reject',
    notes: string
  ) => {
    await adminService.decideModeration(opportunityId, decision, notes);
    await loadData();
  };

  const handleResolveReport = async (reportId: string) => {
    await adminService.resolveReport(reportId);
    await loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-brand-600" />
          <span>{t('admin.dashboardTitle')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review community submissions, inspect original source URLs, manage reports, and verify
          listings before publication.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {t('admin.pendingCount')}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.pendingReviews}
          </span>
        </Card>

        <Card className="p-5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {t('admin.publishedCount')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.activePublished}
          </span>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {t('admin.reportsCount')}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.openReports}
          </span>
        </Card>

        <Card className="p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {t('admin.auditCount')}
            </span>
            <History className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.totalAudits}
          </span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'moderation'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t('admin.tabs.moderation')}</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
            {pendingQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t('admin.tabs.reports')}</span>
          <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
            {reports.filter((r) => r.status === 'pending').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t('admin.tabs.audit')}</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading administration telemetry..." />
      ) : activeTab === 'moderation' ? (
        /* Moderation Queue */
        <div className="space-y-4">
          {pendingQueue.length === 0 ? (
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
                    {pendingQueue.map((opp) => (
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
                            onClick={() => setInspectingOpportunity(opp)}
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
        </div>
      ) : activeTab === 'reports' ? (
        /* User Reports Queue */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">{t('admin.reportsTable.opportunity')}</th>
                  <th className="px-4 py-3">{t('admin.reportsTable.reason')}</th>
                  <th className="px-4 py-3">{t('admin.reportsTable.details')}</th>
                  <th className="px-4 py-3">{t('admin.reportsTable.status')}</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {rep.opportunityTitle}
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                      {rep.reason.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 max-w-sm truncate text-slate-600">
                      {rep.details}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={rep.status === 'resolved' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {rep.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rep.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveReport(rep.id)}
                        >
                          {t('admin.reportsTable.resolve')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Log */
        <AuditLogTable logs={auditLogs} />
      )}

      {/* Moderation Inspect & Decision Modal */}
      <ModerationModal
        isOpen={!!inspectingOpportunity}
        onClose={() => setInspectingOpportunity(null)}
        opportunity={inspectingOpportunity}
        onDecision={handleModerationDecision}
      />
    </div>
  );
};
