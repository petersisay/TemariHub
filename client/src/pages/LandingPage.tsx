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
      {/* Hero Section with Supplied Education-Tech Background & Real Motion Animations */}
      <section className="relative overflow-hidden bg-navy-950 text-white pt-14 pb-24 px-4 sm:px-6 lg:px-8 border-b border-navy-800/80">
        {/* Layer 1: Supplied Education-Tech Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat bg-[center_right] lg:bg-center pointer-events-none opacity-85 transition-opacity duration-700"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />

        {/* Layer 2: Vignette & Contrast Gradients for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-transparent to-navy-950 pointer-events-none" />

        {/* Layer 3: Ambient Light Glows over Globe & Cap */}
        <div className="absolute right-[5%] top-[15%] w-96 h-96 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.22),transparent_70%)] pointer-events-none animate-hero-glow" />
        <div className="absolute right-[12%] top-[25%] w-72 h-72 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.28),transparent_70%)] pointer-events-none animate-hero-beam" />
        <div className="absolute left-[10%] top-[30%] w-80 h-80 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />

        {/* Layer 4: Animated Flowing Light Waves (Horizontal / Diagonal Motion) */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-40">
          {/* Slow Wave */}
          <svg
            className="absolute bottom-0 w-[200%] h-32 opacity-25 animate-hero-wave-slow text-cyan-400"
            viewBox="0 0 1440 180"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C240,120 480,20 720,80 C960,140 1200,40 1440,90 L1440,180 L0,180 Z"
              fill="url(#cyanWaveGrad)"
            />
            <defs>
              <linearGradient id="cyanWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#2563eb" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
          {/* Fast Counter Wave */}
          <svg
            className="absolute -bottom-2 w-[180%] h-24 opacity-20 animate-hero-wave-fast text-brand-500"
            viewBox="0 0 1440 150"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C320,10 640,90 960,30 C1280,100 1400,20 1440,60 L1440,150 L0,150 Z"
              fill="url(#blueWaveGrad)"
            />
            <defs>
              <linearGradient id="blueWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Layer 5: Floating Luminous Particles (Tech Nodes) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '20%', left: '15%', delay: '0s', dur: '5.5s', size: '3px', color: '#00f0ff' },
            { top: '45%', left: '22%', delay: '1.2s', dur: '6s', size: '4px', color: '#60a5fa' },
            { top: '28%', left: '48%', delay: '2.5s', dur: '7s', size: '3px', color: '#38bdf8' },
            { top: '65%', left: '35%', delay: '0.8s', dur: '5.8s', size: '4px', color: '#00f0ff' },
            { top: '35%', left: '72%', delay: '3.1s', dur: '6.2s', size: '5px', color: '#00f0ff' },
            { top: '55%', left: '80%', delay: '1.9s', dur: '6.8s', size: '3px', color: '#93c5fd' },
            { top: '75%', left: '68%', delay: '0.4s', dur: '5.2s', size: '4px', color: '#00f0ff' },
            { top: '15%', left: '85%', delay: '2.2s', dur: '6.5s', size: '3px', color: '#38bdf8' },
            { top: '60%', left: '10%', delay: '3.8s', dur: '6s', size: '4px', color: '#f59e0b' },
          ].map((pt, idx) => (
            <span
              key={idx}
              className="absolute rounded-full hero-particle"
              style={{
                top: pt.top,
                left: pt.left,
                width: pt.size,
                height: pt.size,
                backgroundColor: pt.color,
                boxShadow: `0 0 10px ${pt.color}, 0 0 20px ${pt.color}`,
                animationDelay: pt.delay,
                animationDuration: pt.dur,
              }}
            />
          ))}
        </div>

        {/* Hero Content Container */}
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Target Audience Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900/80 backdrop-blur-md border border-cyan-500/30 text-xs font-semibold text-amber-300 shadow-lg shadow-cyan-950/40 animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Hero Heading with subtle drop shadow for crisp readability */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none text-white drop-shadow-sm">
            {t('hero.title')}
          </h1>

          <p className="text-slate-200 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-xs font-normal">
            {t('hero.subtitle')}
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl shadow-blue-950/60 flex flex-col sm:flex-row items-center gap-2 border border-slate-200 focus-within:ring-2 focus-within:ring-cyan-400 focus-within:border-transparent transition-all"
          >
            <div className="flex items-center gap-2.5 flex-1 px-3 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full text-slate-800 text-sm py-2 placeholder-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto px-6 font-semibold shadow-md shadow-brand-600/30 hover:shadow-brand-600/50"
            >
              {t('hero.searchBtn')}
            </Button>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">{t('hero.popular')}</span>
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => navigate(`/opportunities?search=${encodeURIComponent(tag.q)}`)}
                className="bg-navy-900/70 hover:bg-navy-800 text-slate-200 hover:text-cyan-300 px-3 py-1 rounded-full border border-navy-700/80 hover:border-cyan-400/50 backdrop-blur-xs transition-all text-xs shadow-xs"
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
        ) : featured.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
            <ShieldCheck className="w-10 h-10 text-brand-500 mx-auto opacity-70" />
            <h3 className="font-bold text-slate-800 text-sm">
              {t('opportunity.emptyVerified')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t('opportunity.emptyDescription')}
            </p>
          </div>
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
