import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Kanban,
  Flag,
  CheckCircle2,
  Clock,
  Banknote,
  Wrench,
} from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { opportunityService } from '../services/opportunityService';
import { trackerService } from '../services/trackerService';
import { Opportunity } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ReportModal } from '../components/opportunities/ReportModal';

export const OpportunityDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    setIsLoading(true);
    opportunityService.getOpportunityByIdOrSlug(idOrSlug).then(async (opp: Opportunity | undefined) => {
      setOpportunity(opp || null);
      if (opp) {
        const saved = await trackerService.isOpportunitySaved(opp.id);
        const tracked = await trackerService.isOpportunityTracked(opp.id);
        setIsSaved(saved);
        setIsTracked(tracked);
      }
      setIsLoading(false);
    });
  }, [idOrSlug]);

  const handleSaveToggle = async () => {
    if (!opportunity) return;
    const res = await trackerService.toggleSaveOpportunity(opportunity);
    setIsSaved(res.saved);
    showFeedback(res.saved ? 'Saved to bookmarks' : 'Removed from bookmarks');
  };

  const handleTrackClick = async () => {
    if (!opportunity) return;
    await trackerService.addToTracker(opportunity, 'Interested');
    setIsTracked(true);
    showFeedback('Added to your Student Application Tracker as "Interested"');
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading opportunity details..." />;
  }

  if (!opportunity) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Opportunity not found</h2>
        <p className="text-xs text-slate-500">
          The requested opportunity could not be located or may have been removed.
        </p>
        <Link to="/opportunities">
          <Button variant="primary" size="sm">
            Browse All Opportunities
          </Button>
        </Link>
      </div>
    );
  }

  const deadlineDate = new Date(opportunity.deadline);
  const isPast = deadlineDate.getTime() < Date.now();
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-950 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-navy-800">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Back to listings */}
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('opportunity.backToList')}</span>
      </Link>

      {/* Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="md">
                {t(`filter.type_${opportunity.opportunityType}`)}
              </Badge>
              {opportunity.organization.isVerified && (
                <Badge variant="teal" size="md" icon={<CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}>
                  {t('opportunity.verified')}
                </Badge>
              )}
              {isPast ? (
                <Badge variant="danger" size="md">
                  {t('opportunity.expired')}
                </Badge>
              ) : daysRemaining <= 7 && daysRemaining >= 0 ? (
                <Badge variant="warning" size="md" icon={<Clock className="w-3.5 h-3.5 text-amber-600" />}>
                  {daysRemaining} Days Left
                </Badge>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {opportunity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{opportunity.organization.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{opportunity.location}</span>
                <span className="text-slate-300">({t(`filter.arr_${opportunity.workArrangement}`)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Deadline: {deadlineDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button variant="primary" size="lg" className="w-full">
                <span>{t('opportunity.applyNow')}</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </a>

            <div className="flex items-center gap-2">
              <Button
                variant={isSaved ? 'amber' : 'outline'}
                size="md"
                onClick={handleSaveToggle}
                className="flex-1"
                icon={<Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />}
              >
                {isSaved ? t('opportunity.saved') : t('opportunity.save')}
              </Button>

              <Button
                variant={isTracked ? 'secondary' : 'outline'}
                size="md"
                onClick={isTracked ? () => navigate('/tracker') : handleTrackClick}
                className="flex-1"
                icon={<Kanban className="w-4 h-4" />}
              >
                {isTracked ? t('opportunity.alreadyTracked') : t('opportunity.track')}
              </Button>
            </div>
          </div>
        </div>

        {/* Verified Source Disclaimer Banner */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Verified Authentic Source</span>
              <span className="text-slate-500">
                {opportunity.sourceNotes || t('opportunity.sourceDisclaimer')}
              </span>
            </div>
          </div>
          <a
            href={opportunity.originalSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center gap-1 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <span>{t('opportunity.sourceUrl')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Qualifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {t('opportunity.description')}
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
              {opportunity.description}
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
              <Wrench className="w-4 h-4 text-brand-600" />
              <h3>{t('opportunity.skills')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {opportunity.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="bg-brand-50 text-brand-700 font-medium px-3 py-1 rounded-lg text-xs border border-brand-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Key Details Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Key Requirements & Details
            </h3>

            {/* Compensation */}
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                {t('opportunity.compensation')}
              </span>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Banknote className="w-4 h-4 text-emerald-600" />
                {opportunity.compensation.type === 'stipend' || opportunity.compensation.type === 'paid' ? (
                  <span>
                    {opportunity.compensation.amount?.toLocaleString()} {opportunity.compensation.currency} ({opportunity.compensation.period})
                  </span>
                ) : (
                  <span className="capitalize">{opportunity.compensation.type}</span>
                )}
              </div>
            </div>

            {/* Eligible Disciplines */}
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                {t('opportunity.eligibleFields')}
              </span>
              <ul className="space-y-1 text-slate-700 font-medium">
                {opportunity.eligibleFields.map((field) => (
                  <li key={field} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligible Levels */}
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                {t('opportunity.eligibleLevels')}
              </span>
              <div className="flex flex-wrap gap-1">
                {opportunity.eligibleLevels.map((lvl) => (
                  <span
                    key={lvl}
                    className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium capitalize"
                  >
                    {lvl.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Reporting Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setReportModalOpen(true)}
                className="text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors text-xs"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t('opportunity.report')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Listing Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        opportunity={opportunity}
      />
    </div>
  );
};
