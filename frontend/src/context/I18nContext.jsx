import { createContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';

const locales = { en, fr, ar };

export const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    return localStorage.getItem('lang') || 'fr';
  });

  const setLocale = useCallback((lang) => {
    setLocaleState(lang);
    localStorage.setItem('lang', lang);
  }, []);

  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = locales[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    return value || key;
  }, [locale]);

  // Get localized field from DB object (name_en, name_fr, name_ar)
  const tField = useCallback((obj, field) => {
    if (!obj) return '';
    const localized = obj[`${field}_${locale}`];
    if (localized) return localized;
    return obj[`${field}_en`] || obj[`${field}_fr`] || obj[field] || '';
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tField }}>
      {children}
    </I18nContext.Provider>
  );
}
