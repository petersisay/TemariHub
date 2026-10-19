import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Opportunity } from '../../types';
import { Badge } from '../common/Badge';
import { useTranslation } from '../../context/I18nContext';
import { trackerService } from '../../services/trackerService';

interface OpportunityCardProps {
  opportunity: Opportunity;
  initialSaved?: boolean;
  onSaveToggle?: (opportunity: Opportunity, saved: boolean) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  initialSaved = false,
  onSaveToggle,
}) => {
  const { t } = useTranslation();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  const deadlineDate = new Date(opportunity.deadline);
  const isPast = deadlineDate.getTime() < Date.now();
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isClosingSoon = !isPast && daysRemaining <= 7 && daysRemaining >= 0;

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);
    try {
      const res = await trackerService.toggleSaveOpportunity(opportunity);
      setIsSaved(res.saved);
      if (onSaveToggle) onSaveToggle(opportunity, res.saved);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const typeTranslationKey = `filter.type_${opportunity.opportunityType}`;
  const arrangementTranslationKey = `filter.arr_${opportunity.workArrangement}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 group">
      <div>
        {/* Top Badges & Save Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="primary" size="sm">
              {t(typeTranslationKey)}
            </Badge>

            {opportunity.organization.isVerified && (
              <Badge variant="teal" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-teal-600" />}>
                {t('opportunity.verified')}
              </Badge>
            )}

            {isPast || opportunity.publicationStatus === 'expired' ? (
              <Badge variant="danger" size="sm">
                {t('opportunity.expired')}
              </Badge>
            ) : isClosingSoon ? (
              <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3 text-amber-600" />}>
                {t('opportunity.closingSoon')}
              </Badge>
            ) : null}
          </div>

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`p-1.5 rounded-lg border transition-all ${
              isSaved
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title={isSaved ? t('opportunity.saved') : t('opportunity.save')}
            aria-label={isSaved ? 'Unsave opportunity' : 'Save opportunity'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Title & Organization */}
        <Link to={`/opportunities/${opportunity.slug}`} className="block group-hover:text-brand-600 transition-colors">
          <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 line-clamp-2 mb-1 leading-snug">
            {opportunity.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{opportunity.organization.name}</span>
        </div>

        {/* Location & Work Arrangement */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span>{t(arrangementTranslationKey)}</span>
          </div>
        </div>

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {opportunity.requiredSkills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
            >
              {skill}
            </span>
          ))}
          {opportunity.requiredSkills.length > 3 && (
            <span className="text-[11px] text-slate-400 px-1 py-0.5">
              +{opportunity.requiredSkills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Deadline & Action Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {opportunity.isRollingDeadline
              ? t('opportunity.rolling')
              : new Date(opportunity.deadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
          </span>
        </div>

        <Link
          to={`/opportunities/${opportunity.slug}`}
          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800 transition-colors"
        >
          <span>{t('common.view')}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
