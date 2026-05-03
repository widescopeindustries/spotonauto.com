'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu, Menu, X } from 'lucide-react';

const desktopNavItems = [
  { key: 'Diagnose', href: '/diagnose' },
  { key: 'Guides', href: '/repair' },
  { key: 'Codes', href: '/codes' },
  { key: 'Garage', href: '/history' },
];

export default function Header() {
  const router = useRouter();
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#050507]/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="SpotOnAuto Home"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-shadow">
                <Cpu className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl text-white tracking-tight">
                SpotOn<span className="text-[#FF6B00]">Auto</span>
              </span>
            </Link>

            <form onSubmit={handleSearchSubmit} className="hidden lg:flex min-w-[260px] items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0f]/60 px-3 py-1.5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symptom, code, or repair"
                aria-label="Search SpotOnAuto"
                className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-bold text-white hover:bg-[#FF9500]"
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
                  className="relative px-4 py-2 text-sm text-[#EAEAEA]/70 hover:text-white transition-colors group"
                >
                  {item.key}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#FF6B00] group-hover:w-3/4 transition-all duration-300" />
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10">
                <span className="text-xs text-[#FF6B00]">SDVOSB Certified</span>
              </div>
              <Link
                href="/auth"
                className="glass-button text-white text-xs"
              >
                Sign In
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#050507]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-8 pt-20">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-2xl text-white"
              >
                {item.key}
              </Link>
            ))}
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 mt-4">
              <span className="text-sm text-[#FF6B00]">SDVOSB Certified</span>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex w-72 items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0f]/60 px-3 py-2 mt-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-bold text-white"
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
