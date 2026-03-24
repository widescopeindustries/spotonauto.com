import Link from 'next/link';
import { Cpu } from 'lucide-react';
import HeaderChrome from '@/components/HeaderChrome';

const desktopNavItems = [
  { label: 'Repair Guides', href: '/repair' },
  { label: 'Wiring Diagrams', href: '/wiring' },
  { label: 'Look Up a Code', href: '/codes' },
  { label: 'AI Diagnosis', href: '/diagnose' },
  { label: 'Community', href: '/community' },
];

export default function Header() {
  return (
    <header className="header-slide-in fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
            aria-label="SpotOnAuto Home"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-lg animate-pulse-glow" />
              <Cpu className="w-6 h-6 text-cyan-400 relative z-10" />
            </div>
            <span className="font-display font-bold text-xl tracking-wider text-white">
              SPOTON<span className="text-cyan-400">AUTO</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <HeaderChrome />
        </div>
      </div>
    </header>
  );
}
