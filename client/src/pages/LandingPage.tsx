import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { opportunityService } from '../services/opportunityService';
import { Opportunity } from '../types';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    opportunityService.getOpportunities({ limit: 6, sortBy: 'newest' }).then((res) => {
      if (isMounted) {
        setFeatured(res.items);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/opportunities');
    }
  };

  const quickTags = [
    { label: 'ASTU Internships', q: 'ASTU' },
    { label: 'Python & AI', q: 'Python' },
    { label: 'FinTech Hackathons', q: 'Telebirr' },
    { label: 'Remote STEM Roles', q: 'Remote' },
    { label: 'Scholarships', q: 'Scholarship' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Deep Navy Visual Depth */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-slate-900 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Target Audience Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-navy-700/80 text-xs font-semibold text-amber-300 shadow-xs animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            {t('hero.title')}
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
          >
            <div className="flex items-center gap-2.5 flex-1 px-3 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full text-slate-800 text-sm py-2 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto px-6 font-semibold"
            >
              {t('hero.searchBtn')}
            </Button>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{t('hero.popular')}</span>
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => navigate(`/opportunities?search=${encodeURIComponent(tag.q)}`)}
                className="bg-navy-800/60 hover:bg-navy-700 text-slate-200 hover:text-white px-2.5 py-1 rounded-full border border-navy-700 transition-colors text-xs"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Feature Blocks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Verified Original Sources
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every listing is verified with official links. No broken URLs or unverified
                recruitment scams.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0 border border-blue-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                7-Stage Student Application Tracker
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Privately track opportunities from "Interested" to "Accepted" with custom notes and
                deadline alerts.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                ASTU Pilot & Scalable Nationwide
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Focused on Ethiopian STEM universities (ASTU, AAU, BDU, Hawassa) with bilingual
                English & Amharic access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Opportunities Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Latest Verified Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Internships, fellowships, and tech competitions currently accepting applications.
            </p>
          </div>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
          >
            <span>{t('hero.allOpportunities')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching verified listings..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </section>

      {/* Submitter & Employer CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-navy-950 to-navy-900 p-8 sm:p-12 text-white border border-navy-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>For Companies, Labs & Student Clubs</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Seeking Ethiopian STEM & Software Engineering Talent?
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Post your internship, technical workshop, hackathon, or junior developer opening
              directly to students from ASTU and across Ethiopia.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link to="/submit" className="w-full sm:w-auto">
              <Button variant="amber" size="lg" className="w-full">
                {t('hero.submitCta')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
