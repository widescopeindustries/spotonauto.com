'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Shield, X, Zap } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import HeaderAccountControls from '@/components/HeaderAccountControls';

const mobileNavItems = [
  { label: 'Guides', href: '/guides' },
  { label: 'Wiring Diagrams', href: '/wiring' },
  { label: 'Codes', href: '/codes' },
  { label: 'Repair Hub', href: '/repair' },
  { label: 'Parts', href: '/parts' },
  { label: 'Community', href: '/community' },
];

export default function HeaderChrome() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="hidden md:flex items-center gap-3">
        <LanguageSelector />
        <Link
          href="/diagnose"
          className="btn-cyber flex items-center gap-2 py-2 px-4 hover:scale-105 active:scale-95 transition-transform duration-200"
        >
          <Zap className="w-4 h-4" />
          <span className="text-xs">Diagnose</span>
        </Link>
        <Link
          href="/second-opinion"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Shield className="w-4 h-4" />
          <span className="font-body text-sm">2nd Opinion</span>
        </Link>
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
          <div className="rounded-2xl border border-cyan-500/15 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Quick access</p>
            <p className="mt-2 text-xs leading-5 text-gray-400">
              Fast paths into repair, wiring, codes, and community without waiting on extra UI state.
            </p>
          </div>

          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Guide language</span>
              <LanguageSelector />
            </div>

            <Link
              href="/diagnose"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-amber-400 w-full font-semibold"
            >
              <Zap className="w-4 h-4" />
              <span className="font-body">Diagnose My Car</span>
            </Link>

            <Link
              href="/second-opinion"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-cyan-400 w-full font-semibold"
            >
              <Shield className="w-4 h-4" />
              <span className="font-body">2nd Opinion</span>
            </Link>

            <Link
              href="/history"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
            >
              History
            </Link>

            <Link
              href="/auth"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn-cyber block w-full text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
