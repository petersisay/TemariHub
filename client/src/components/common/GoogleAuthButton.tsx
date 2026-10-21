import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { AlertCircle, Loader2, Info } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: any) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  mode?: 'login' | 'register';
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  mode = 'login',
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(
    clientId &&
      clientId.trim() !== '' &&
      !clientId.includes('YOUR_GOOGLE_CLIENT_ID') &&
      !clientId.includes('REPLACE_WITH')
  );

  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) {
      const err = language === 'am' ? 'የጉግል መግቢያ አልተሳካም (ምልክት አልተገኘም)' : 'Google sign-in cancelled or missing credential.';
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user } = await loginWithGoogle(response.credential);

      if (onSuccess) {
        onSuccess();
      } else {
        // Role-based routing
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'submitter') {
          navigate('/submission-status');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const displayErr =
        err.message ||
        (language === 'am'
          ? 'በጉግል መግባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።'
          : 'Google authentication failed. Please check network or try again.');
      setErrorMessage(displayErr);
      onError?.(displayErr);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isConfigured) return;

    let isMounted = true;

    const setupGoogleSignIn = () => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official GIS button
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: language === 'am' ? 'am' : 'en',
        });
      } catch (err) {
        console.warn('Google Identity Services initialization warning:', err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleSignIn();
    } else {
      // Check if script already appended
      const existingScript = document.getElementById('google-client-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-client-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) setupGoogleSignIn();
        };
        script.onerror = () => {
          if (isMounted) {
            setErrorMessage(
              language === 'am'
                ? 'የጉግል መግቢያ አገልግሎትን መጫን አልተቻለም።'
                : 'Could not load Google Identity Services. Check your connection.'
            );
          }
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', setupGoogleSignIn);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, isConfigured, language, mode]);

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="w-full h-11 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center gap-2 text-slate-600 text-sm font-medium shadow-2xs">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span>
            {language === 'am'
              ? 'በጉግል አካውንት በመግባት ላይ...'
              : 'Authenticating with Google...'}
          </span>
        </div>
      ) : isConfigured ? (
        <div className="w-full flex justify-center">
          <div ref={buttonContainerRef} className="min-h-[44px] w-full flex justify-center" />
        </div>
      ) : (
        /* Configuration Pending State Banner - Genuine, never fake login */
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left space-y-2.5 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              {/* Google G SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {language === 'am'
                  ? 'የጉግል መግቢያ ማዋቀር በመጠባበቅ ላይ'
                  : 'Google Sign-In Configuration Pending'}
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                {language === 'am'
                  ? 'የቀጥታ ጉግል ማረጋገጫን ለማስኬድ VITE_GOOGLE_CLIENT_ID በ .env ውስጥ ማዋቀር ያስፈልጋል። ለአሁኑ ከታች ባለው የኢሜይል ቅጽ መግባት ይችላሉ።'
                  : 'To enable live Google Sign-In, configure VITE_GOOGLE_CLIENT_ID in your environment. You can continue using verified credentials below.'}
              </p>
            </div>
          </div>
          <div className="pt-1 border-t border-amber-200/60 flex items-center gap-1.5 text-[10px] text-amber-700 font-mono">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</span>
          </div>
        </div>
      )}
    </div>
  );
};
