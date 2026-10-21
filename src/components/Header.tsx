'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Cpu, Menu, X, Car } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { useT } from '@/lib/translations';

const desktopNavItems = [
  { key: 'nav.manuals', label: 'Manuals', href: '/manual' },
  { key: 'nav.repairGuides', label: 'Guides', href: '/repair' },
  { key: 'nav.codes', label: 'Codes', href: '/codes' },
  { key: 'nav.diagnose', label: 'Diagnose', href: '/diagnose' },
];

export default function Header() {
  const router = useRouter();
  const t = useT();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const query = search.trim();
    if (!query) return;
    router.push(`/diagnose?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 shadow-sm'
            : 'bg-[#0B0F17]/80 backdrop-blur-sm border-b border-slate-800/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            <Link
              href="/"
              className="flex items-center group"
              aria-label="AllOEMManuals Home"
            >
              <Image
                src="/logo.png"
                alt="AllOEMManuals"
                width={200}
                height={83}
                priority
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.01]"
              />
            </Link>

            <form onSubmit={handleSearchSubmit} className="hidden lg:flex min-w-[280px] items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 focus-within:border-sky-500/60 transition-colors">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symptom, code, or manual..."
                aria-label="Search AllOEMManuals"
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 transition-colors"
                data-track-click='{"event_name":"search_submit","event_category":"search","surface":"header"}'
              >
                Search
              </button>
            </form>

            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3.5 py-2 text-sm text-slate-300 hover:text-white transition-colors group"
                >
                  {t(item.key) || item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-sky-500 group-hover:w-3/4 transition-all duration-200" />
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <LanguageSelector />
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Car className="w-3.5 h-3.5 text-slate-400" />
                Garage
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-slate-300 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#0B0F17]/98 backdrop-blur-xl md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-7 pt-20">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-xl text-slate-200 hover:text-sky-400 font-medium transition-colors"
              >
                {t(item.key) || item.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-slate-400">{t('nav.guideLanguage') || 'Language'}</span>
              <LanguageSelector />
            </div>
            <Link
              href="/history"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 transition-colors mt-2"
            >
              <Car className="w-4 h-4 text-slate-400" />
              Garage
            </Link>
            <form onSubmit={handleSearchSubmit} className="flex w-72 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 mt-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search manuals..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
