import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useTranslation } from '../context/I18nContext';
import enDictionary from '../i18n/en.json';
import amDictionary from '../i18n/am.json';

const TestComponent = () => {
  const { t, language, setLanguage } = useTranslation();
  return (
    <div>
      <span data-testid="opp-nav">{t('nav.opportunities')}</span>
      <span data-testid="current-lang">{language}</span>
      <button onClick={() => setLanguage('am')} data-testid="btn-am">
        Switch to Amharic
      </button>
      <button onClick={() => setLanguage('en')} data-testid="btn-en">
        Switch to English
      </button>
    </div>
  );
};

describe('Localization System (i18n)', () => {
  it('has identical top-level and nested key structures between English and Amharic', () => {
    const getDeepKeys = (obj: Record<string, any>, prefix = ''): string[] => {
      return Object.keys(obj).reduce((res: string[], el: string) => {
        if (Array.isArray(obj[el])) {
          return res;
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
          return [...res, ...getDeepKeys(obj[el], `${prefix}${el}.`)];
        }
        return [...res, `${prefix}${el}`];
      }, []);
    };

    const enKeys = getDeepKeys(enDictionary).sort();
    const amKeys = getDeepKeys(amDictionary).sort();

    // Check that every English key has an Amharic equivalent
    enKeys.forEach((key) => {
      expect(amKeys).toContain(key);
    });
  });

  it('renders English text by default and dynamically updates on language switch without route reload', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Initial English check
    expect(screen.getByTestId('opp-nav').textContent).toBe('Opportunities');
    expect(screen.getByTestId('current-lang').textContent).toBe('en');

    // Switch to Amharic
    fireEvent.click(screen.getByTestId('btn-am'));
    expect(screen.getByTestId('opp-nav').textContent).toBe('ዕድሎች');
    expect(screen.getByTestId('current-lang').textContent).toBe('am');

    // Switch back to English
    fireEvent.click(screen.getByTestId('btn-en'));
    expect(screen.getByTestId('opp-nav').textContent).toBe('Opportunities');
    expect(screen.getByTestId('current-lang').textContent).toBe('en');
  });
});
