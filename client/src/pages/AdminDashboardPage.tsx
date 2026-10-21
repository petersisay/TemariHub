import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  ExternalLink,
  RefreshCw,
  Globe,
  Radio,
  FileCheck,
} from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { Opportunity, OpportunityReport, AuditLogItem, TrustedSource } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Avatar } from '../components/common/Avatar';
import { ModerationModal } from '../components/admin/ModerationModal';
import { AuditLogTable } from '../components/admin/AuditLogTable';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    activePublished: 0,
    openReports: 0,
    totalAudits: 0,
    totalVerified: 0,
    pendingVerification: 0,
    needsRecheck: 0,
    totalSources: 0,
    healthySources: 0,
    failingSources: 0,
  });

  const [activeTab, setActiveTab] = useState<
    'verification' | 'sources' | 'change_history' | 'moderation' | 'reports' | 'audit'
  >('verification');

  const [pendingQueue, setPendingQueue] = useState<Opportunity[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<Opportunity[]>([]);
  const [trustedSources, setTrustedSources] = useState<TrustedSource[]>([]);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [reports, setReports] = useState<OpportunityReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSource, setIsCheckingSource] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<string>('PENDING_REVIEW');
  const [inspectingOpportunity, setInspectingOpportunity] = useState<Opportunity | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showSuccessBanner = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statData, queueData, repData, logData, verifData, srcData, histData] =
        await Promise.all([
          adminService.getAdminStats(),
          adminService.getModerationQueue(),
          adminService.getReports(),
          adminService.getAuditLogs(),
          adminService.getVerificationQueue(verificationFilter),
          adminService.getTrustedSources(),
          adminService.getChangeHistory(),
        ]);

      setStats({
        pendingReviews: statData?.pendingReviews ?? statData?.pendingModeration ?? 0,
        activePublished: statData?.activePublished ?? statData?.publishedOpportunities ?? 0,
        openReports: statData?.openReports ?? statData?.pendingReports ?? 0,
        totalAudits: statData?.totalAudits ?? statData?.totalTracked ?? 0,
        totalVerified: statData?.totalVerified ?? 0,
        pendingVerification: statData?.pendingVerification ?? 0,
        needsRecheck: statData?.needsRecheck ?? 0,
        totalSources: statData?.totalSources ?? (Array.isArray(srcData) ? srcData.length : 0),
        healthySources: statData?.healthySources ?? 0,
        failingSources: statData?.failingSources ?? 0,
      });

      setPendingQueue(Array.isArray(queueData) ? queueData : []);
      setReports(Array.isArray(repData) ? repData : []);
      setAuditLogs(Array.isArray(logData) ? logData : []);
      setVerificationQueue(Array.isArray(verifData) ? verifData : []);
      setTrustedSources(Array.isArray(srcData) ? srcData : []);
      setChangeHistory(Array.isArray(histData) ? histData : []);
    } catch (err) {
      console.warn('Error loading admin telemetry, using safe defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [verificationFilter]);

  const handleVerificationDecision = async (
    opportunityId: string,
    status: 'VERIFIED' | 'REJECTED' | 'NEEDS_RECHECK',
    evidenceNotes: string
  ) => {
    try {
      await adminService.decideVerification(opportunityId, status, evidenceNotes);
      showSuccessBanner(`Opportunity marked as ${status}. Verification audit recorded.`);
      await loadData();
    } catch (err: any) {
      alert(`Verification decision failed: ${err.message}`);
    }
  };

  const handleTriggerSingleCheck = async (sourceId: string, sourceName: string) => {
    setIsCheckingSource(true);
    try {
      const res = await adminService.triggerSourceCheck(sourceId);
      showSuccessBanner(
        `Source check for ${sourceName} completed: Discovered ${res?.newDiscovered || 0} new, updated ${res?.updated || 0}.`
      );
      await loadData();
    } catch (err: any) {
      alert(`Check failed: ${err.message}`);
    } finally {
      setIsCheckingSource(false);
    }
  };

  const handleCheckAllSources = async () => {
    setIsCheckingSource(true);
    try {
      const res = await adminService.checkAllSources();
      showSuccessBanner(
        `Continuous monitoring complete: Checked ${res?.sourcesChecked || 0} sources. Discovered ${res?.totalDiscovered || 0} new opportunities.`
      );
      await loadData();
    } catch (err: any) {
      alert(`Monitoring sweep error: ${err.message}`);
    } finally {
      setIsCheckingSource(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.avatarUrl}
            name={user?.name || 'Administrator'}
            size="lg"
            className="hidden sm:flex shrink-0 shadow-xs"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-brand-600" />
              <span>{t('admin.dashboardTitle')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {user ? `Logged in as ${user.name} (${user.email}). ` : ''}Verified opportunities workflow, trusted source monitoring, change tracking, and moderation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button variant="outline" size="sm">
              Account Settings
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCheckAllSources}
            isLoading={isCheckingSource}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Check All Sources Now
          </Button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Verified Listings
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.totalVerified || stats.activePublished}
          </span>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Pending Verification
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.pendingVerification || stats.pendingReviews}
          </span>
        </Card>

        <Card className="p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Trusted Sources
            </span>
            <Globe className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats.totalSources || trustedSources.length}
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
      </div>

      {/* Institutional Source Operational Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Automated Discovery</span>
          <span className="text-sm font-bold text-slate-800">
            {trustedSources.filter((s) => s.monitoringMethod !== 'manual_review').length} Sources (RSS/Web)
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Manual Review Workflow</span>
          <span className="text-sm font-bold text-amber-700">
            {trustedSources.filter((s) => s.monitoringMethod === 'manual_review').length} Protected Portals
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Monitoring Failures</span>
          <span className={`text-sm font-bold ${trustedSources.some((s) => s.monitoringStatus === 'failing') ? 'text-rose-600' : 'text-emerald-600'}`}>
            {trustedSources.filter((s) => s.monitoringStatus === 'failing').length} Needs Attention
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Discovered Announcements</span>
          <span className="text-sm font-bold text-brand-600">
            {trustedSources.reduce((acc, s) => acc + (s.opportunitiesDiscoveredCount || 0), 0)} Total
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'verification'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Verification Queue</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
            {verificationQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sources'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Trusted Sources</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
            {trustedSources.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('change_history')}
          className={`pb-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'change_history'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Detected Updates</span>
          <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
            {changeHistory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'moderation'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Submissions</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
            {pendingQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
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
          className={`pb-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
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
      ) : activeTab === 'verification' ? (
        /* Verification Workflow Tab */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
              <div className="flex gap-1.5">
                {['PENDING_REVIEW', 'NEEDS_RECHECK', 'EXPIRED', 'VERIFIED', 'ALL'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setVerificationFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      verificationFilter === st
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-500">
              Showing {verificationQueue.length} listings in queue
            </span>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No opportunities pending review under filter "{verificationFilter}"</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Opportunity & Organization</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Source Provenance</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationQueue.map((opp) => (
                      <tr key={opp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">{opp.title}</span>
                          <span className="text-[11px] text-slate-500">{opp.organization.name}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              opp.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : opp.verificationStatus === 'NEEDS_RECHECK'
                                ? 'bg-amber-100 text-amber-800'
                                : opp.verificationStatus === 'EXPIRED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {opp.verificationStatus || 'PENDING_REVIEW'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <a
                            href={opp.originalSourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 hover:underline inline-flex items-center gap-1 font-medium truncate block max-w-xs"
                          >
                            <span className="truncate">{opp.originalSourceUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {opp.sourceName || 'Unregistered Source'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {new Date(opp.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleVerificationDecision(
                                opp.id,
                                'VERIFIED',
                                'Official announcement confirmed authentic on institutional portal.'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() =>
                              handleVerificationDecision(
                                opp.id,
                                'NEEDS_RECHECK',
                                'Source link modified or deadline details require rechecking.'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors"
                          >
                            Recheck
                          </button>
                          <button
                            onClick={() =>
                              handleVerificationDecision(
                                opp.id,
                                'REJECTED',
                                'Opportunity withdrawn or source authenticity unconfirmed.'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'sources' ? (
        /* Trusted Sources Registry Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Verified Source Registry</h3>
              <p className="text-xs text-slate-500">
                Official Ethiopian universities, corporations, government institutes, and technology portals.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCheckAllSources}
              isLoading={isCheckingSource}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Trigger Full Scan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trustedSources.map((source) => (
              <div
                key={source.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{source.name}</h4>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      {source.category.replace('_', ' ')}
                    </span>
                  </div>
                  {(() => {
                    let badgeLabel = 'Website reachable';
                    let badgeClass = 'bg-sky-50 text-sky-800 border border-sky-200';
                    if (source.monitoringStatus === 'failing') {
                      badgeLabel = 'Monitoring failed';
                      badgeClass = 'bg-rose-50 text-rose-800 border border-rose-200';
                    } else if (source.monitoringStatus === 'not_configured') {
                      badgeLabel = 'Awaiting source configuration';
                      badgeClass = 'bg-slate-50 text-slate-700 border border-slate-200';
                    } else if (source.monitoringMethod === 'manual_review') {
                      badgeLabel = 'Manual monitoring only';
                      badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
                    } else if (
                      source.monitoringMethod === 'rss_feed' ||
                      source.monitoringMethod === 'official_api' ||
                      source.opportunitiesDiscoveredCount > 0
                    ) {
                      badgeLabel = 'Discovery operational';
                      badgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                    }
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {source.notes || 'Configured verified institutional source.'}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Monitoring Method:</span>
                    <span className="font-medium text-slate-700 capitalize">
                      {source.monitoringMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discovered Count:</span>
                    <span className="font-bold text-brand-600">
                      {source.opportunitiesDiscoveredCount || 0}
                    </span>
                  </div>
                  {source.lastSuccessfulCheck && (
                    <div className="flex justify-between">
                      <span>Last Checked:</span>
                      <span className="text-slate-600">
                        {new Date(source.lastSuccessfulCheck).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={source.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTriggerSingleCheck(source.id, source.name)}
                    isLoading={isCheckingSource}
                    icon={<RefreshCw className="w-3 h-3" />}
                  >
                    Check Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'change_history' ? (
        /* Detected Material Updates Tab */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Material Change Detection Trail</h3>
              <p className="text-xs text-slate-500">
                Audited timeline of deadline extensions, requirement corrections, and withdrawn announcements.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {changeHistory.length} recorded events
            </span>
          </div>

          {changeHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">All announcements are up-to-date with original sources</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Opportunity</th>
                    <th className="px-4 py-3">Field Modified</th>
                    <th className="px-4 py-3">Previous Value</th>
                    <th className="px-4 py-3">Updated Value</th>
                    <th className="px-4 py-3">Reason / Source Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {changeHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.opportunityTitle}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {item.organizationName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-brand-600 font-bold uppercase text-[10px]">
                        {item.fieldChanged}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                        {item.oldValue}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-emerald-700 font-bold font-mono text-[11px]">
                        {item.newValue}
                      </td>
                      <td className="px-4 py-3 max-w-sm text-slate-600">
                        <span>{item.reason}</span>
                        {item.sourceEvidence && (
                          <a
                            href={item.sourceEvidence}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[10px] text-brand-600 hover:underline truncate mt-0.5"
                          >
                            Evidence: {item.sourceEvidence}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'moderation' ? (
        /* Standard Submissions Moderation Queue */
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
