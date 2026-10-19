import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '../components/common/Button';

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          An unexpected error occurred while rendering this interface.
        </p>
        {error && (
          <div className="p-3 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-700 text-left overflow-x-auto">
            {error.message}
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-center">
        <Button
          variant="primary"
          size="md"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={resetErrorBoundary || (() => window.location.reload())}
        >
          Reload Interface
        </Button>
      </div>
    </div>
  );
};
