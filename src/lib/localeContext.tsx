'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocaleInfo {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

const STORAGE_KEY = 'spoton-locale';

interface LocaleContextType {
  locale: string;
  setLocale: (code: string) => void;
  localeInfo: LocaleInfo;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: () => {},
  localeInfo: SUPPORTED_LOCALES[0],
});

export const useLocale = () => useContext(LocaleContext);

export const getLocaleName = (code: string) =>
  SUPPORTED_LOCALES.find(l => l.code === code)?.name ?? 'English';

export const getLocaleFlag = (code: string) =>
  SUPPORTED_LOCALES.find(l => l.code === code)?.flag ?? '🇺🇸';

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.some(l => l.code === stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (code: string) => {
    setLocaleState(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const localeInfo = SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, localeInfo }}>
      {children}
    </LocaleContext.Provider>
  );
};
