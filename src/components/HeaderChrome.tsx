'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import HeaderAccountControls from '@/components/HeaderAccountControls';
import { useT } from '@/lib/translations';

const mobileNavItems = [
  { key: 'nav.repairGuides', href: '/repair' },
  { key: 'nav.wiringDiagrams', href: '/wiring' },
  { key: 'nav.codes', href: '/codes' },
  { key: 'nav.diagnose', href: '/diagnose' },
  { key: 'nav.community', href: '/community' },
];

export default function HeaderChrome() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useT();

  return (
    <>
      <div className="hidden md:flex items-center gap-3">
        <LanguageSelector />
        <HeaderAccountControls />
      </div>

      <button
        className="md:hidden text-white"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <nav
        aria-label="Mobile navigation"
        className={`md:hidden glass-strong border-t border-cyan-500/20 overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-6 space-y-4">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t(item.key)}
            </Link>
          ))}

          <div className="pt-4 border-t border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">{t('nav.guideLanguage')}</span>
              <LanguageSelector />
            </div>

            <Link
              href="/auth"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn-cyber block w-full text-center"
            >
              {t('nav.signIn')}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
