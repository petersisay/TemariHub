import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../i18n/en.json';
import amTranslations from '../i18n/am.json';

export type Language = 'en' | 'am';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, any> = {
  en: enTranslations,
  am: amTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'temarihub_language_preference';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'am') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'am') {
      document.body.classList.add('font-ethiopic');
    } else {
      document.body.classList.remove('font-ethiopic');
    }
  }, [language]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary if Amharic key is missing
        let fallback: any = translations['en'];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path; // Return raw key if completely missing
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
