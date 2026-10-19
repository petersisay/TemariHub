import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Kanban,
  Bookmark,
  Compass,
  ArrowRight,
  UserCheck,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trackerService } from '../services/trackerService';
import { opportunityService } from '../services/opportunityService';
import { ApplicationTrackerItem, Opportunity } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [trackerItems, setTrackerItems] = useState<ApplicationTrackerItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [recommended, setRecommended] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      trackerService.getTrackerItems(),
      trackerService.getSavedOpportunities(),
      opportunityService.getOpportunities({ limit: 4, sortBy: 'newest' }),
    ]).then(([trackers, saved, opps]) => {
      if (isMounted) {
        setTrackerItems(trackers);
        setSavedCount(saved.length);
        setRecommended(opps.items);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading your student dashboard..." />;
  }

  const upcomingDeadlines = trackerItems.filter((t) => {
    const d = new Date(t.opportunity.deadline).getTime();
    const diffDays = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-700 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Student Opportunity Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Track your internship applications, manage your university profile, and never miss an
            opportunity deadline.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/opportunities">
            <Button variant="amber" size="md">
              <Compass className="w-4 h-4 mr-1.5" />
              Explore Feed
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <UserCheck className="w-4 h-4 mr-1.5" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Applications Tracked
            </span>
            <span className="text-2xl font-black text-slate-900">{trackerItems.length}</span>
            <Link to="/tracker" className="block text-xs text-brand-600 font-semibold hover:underline mt-0.5">
              Open Board →
            </Link>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Saved Listings
            </span>
            <span className="text-2xl font-black text-slate-900">{savedCount}</span>
            <Link to="/saved" className="block text-xs text-amber-600 font-semibold hover:underline mt-0.5">
              View Bookmarks →
            </Link>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Deadlines Within 14 Days
            </span>
            <span className="text-2xl font-black text-slate-900">
              {upcomingDeadlines.length}
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Tracked opportunities closing soon
            </span>
          </div>
        </Card>
      </div>

      {/* Tracked Applications In Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Active Applications Tracker</h2>
          <Link to="/tracker" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
            View All 7 Stages →
          </Link>
        </div>

        {trackerItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            You haven't added any opportunities to your tracker board yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {trackerItems.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <Link
                    to={`/opportunities/${item.opportunity.slug}`}
                    className="font-bold text-sm text-slate-900 hover:text-brand-600"
                  >
                    {item.opportunity.title}
                  </Link>
                  <p className="text-xs text-slate-500 font-medium">{item.opportunity.organization.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold bg-blue-50 text-brand-700 px-3 py-1 rounded-full border border-blue-200">
                    Stage: {item.status}
                  </span>
                  <Link
                    to="/tracker"
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Opportunities */}
      {recommended.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recommended Opportunities</h2>
            <Link
              to="/opportunities"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommended.slice(0, 2).map((opp) => (
              <Card key={opp.id} className="p-4 flex flex-col justify-between hoverEffect">
                <div>
                  <Link
                    to={`/opportunities/${opp.slug}`}
                    className="font-bold text-sm text-slate-900 hover:text-brand-600 block line-clamp-1"
                  >
                    {opp.title}
                  </Link>
                  <p className="text-xs text-slate-500 font-medium mb-2">{opp.organization.name}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{opp.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 capitalize">{opp.opportunityType.replace('_', ' ')}</span>
                  <Link to={`/opportunities/${opp.slug}`} className="font-semibold text-brand-600 hover:underline">
                    View Details →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
