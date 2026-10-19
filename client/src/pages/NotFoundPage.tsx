import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
        <Compass className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <span className="text-4xl font-black text-slate-900 tracking-tight">404</span>
        <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The opportunity page, document, or route you are attempting to reach does not exist or
          has been moved.
        </p>
      </div>

      <div className="pt-2 flex justify-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
            Return to Homepage
          </Button>
        </Link>
        <Link to="/opportunities">
          <Button variant="outline" size="md">
            Browse Opportunities
          </Button>
        </Link>
      </div>
    </div>
  );
};
