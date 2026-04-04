import { useCallback } from 'react';
import { translations } from './translations';
import { useUI } from '../contexts/DashboardContext';

/**
 * TIP AI — Translation Hook
 * 
 * Usage:
 *   const { t, language } = useTranslation();
 *   <span>{t('nav.dashboard')}</span>
 * 
 * Falls back to English if key is missing in the current language.
 * Falls back to the raw key if missing in both languages.
 */
export function useTranslation() {
  const { language } = useUI();
  
  const t = useCallback((key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  return { t, language };
}

/**
 * Standalone translate function for use outside React components
 * (e.g., in utility functions that receive language as a parameter)
 */
export function translate(key, lang = 'en') {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}
