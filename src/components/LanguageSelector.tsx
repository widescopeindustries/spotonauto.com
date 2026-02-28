'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLocale, SUPPORTED_LOCALES } from '@/lib/localeContext';

const LanguageSelector: React.FC = () => {
  const { locale, setLocale, localeInfo } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 text-sm"
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-gray-300">{localeInfo.flag}</span>
        <span className="text-gray-400 text-xs uppercase">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-[#09090f] border border-cyan-500/20 rounded-xl shadow-2xl z-[60] max-h-80 overflow-y-auto">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                locale === l.code
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span>{l.name}</span>
              {locale === l.code && (
                <span className="ml-auto text-cyan-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
