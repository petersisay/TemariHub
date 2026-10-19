import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, MapPin } from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';

export const Footer: React.FC = () => {
  const { t, language } = useTranslation();

  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-bold text-base">
                T
              </div>
              <span className="font-bold text-lg text-white">TemariHub</span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              {language === 'am'
                ? 'በኢትዮጵያ ዩኒቨርሲቲዎች ውስጥ ለሚገኙ የሳይንስና ቴክኖሎጂ (STEM) ተማሪዎች የተረጋገጡ የልምምድ ስራዎችን፣ ስኮላርሺፖችንና የቴክኖሎጂ ዕድሎችን የሚያቀርብ ዲጂታል መድረክ።'
                : 'A dedicated career and opportunity discovery platform engineered for Ethiopian university students in STEM disciplines. Designed with an initial pilot for Adama Science and Technology University (ASTU) and scalable across all Ethiopian universities.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium bg-navy-900/80 px-3 py-1.5 rounded-lg border border-navy-800 w-fit">
              <MapPin className="w-3.5 h-3.5" />
              <span>Pilot University: Adama Science and Technology University (ASTU)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/opportunities" className="hover:text-white transition-colors">
                  {t('nav.opportunities')}
                </Link>
              </li>
              <li>
                <Link to="/tracker" className="hover:text-white transition-colors">
                  {t('nav.tracker')}
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-white transition-colors">
                  {t('nav.saved')}
                </Link>
              </li>
              <li>
                <Link to="/submit" className="hover:text-white transition-colors">
                  {t('nav.submit')}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  {t('nav.admin')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Principles */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">
              Trust & Transparency
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Original source verification required for all published listings.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Zero fabricated opportunities, partnerships, or synthetic stats.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Student private tracker notes remain confidential.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TemariHub. MIT License. Built for Ethiopian STEM talent.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Ethiopian Students</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
