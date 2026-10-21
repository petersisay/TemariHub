import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, XCircle, ExternalLink, Edit } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { opportunityService } from '../services/opportunityService';
import { Opportunity } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Avatar } from '../components/common/Avatar';

export const SubmissionStatusPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isRecentSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    opportunityService
      .getMySubmissions()
      .then((items) => {
        setSubmissions(items);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load user submissions:', err);
        setSubmissions([]);
        setIsLoading(false);
      });
  }, []);

  const getStatusBadge = (status: Opportunity['moderationStatus']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="teal" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-teal-600" />}>
            Approved & Live
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm" icon={<XCircle className="w-3 h-3 text-rose-600" />}>
            Needs Revision
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3 text-amber-600" />}>
            In Moderation Review
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {isRecentSuccess && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <h4 className="font-bold text-sm">{t('submit.successTitle')}</h4>
            <p>{t('submit.successDesc')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.avatarUrl}
            name={user?.name || 'Submitter'}
            size="lg"
            className="hidden sm:flex shrink-0"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Opportunity Submissions & Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {user ? `Logged in as ${user.name} (${user.email}). ` : ''}Track the verification progress of opportunities you've submitted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button variant="outline" size="sm">
              Account Settings
            </Button>
          </Link>
          <Link to="/submit">
            <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Post Opportunity
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading your submission records..." />
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No submissions yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't submitted any opportunities yet. Once submitted, your listings and their moderation review status will appear here.
          </p>
          <div className="mt-5">
            <Link to="/submit">
              <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                Post an Opportunity
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Moderation State</th>
                  <th className="px-4 py-3">Source URL</th>
                  <th className="px-4 py-3">Reviewer Feedback</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/opportunities/${opp.slug}`}
                        className="font-bold text-slate-900 hover:text-brand-600 block line-clamp-1"
                      >
                        {opp.title}
                      </Link>
                      <span className="text-[11px] text-slate-500">{opp.organization.name}</span>
                    </td>
                    <td className="px-4 py-3.5 capitalize">
                      {opp.opportunityType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(opp.moderationStatus)}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate">
                      <a
                        href={opp.originalSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate">{opp.originalSourceUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs">
                      {opp.sourceNotes || 'Pending initial review by platform administrator.'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/submit?edit=${opp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <Edit className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
