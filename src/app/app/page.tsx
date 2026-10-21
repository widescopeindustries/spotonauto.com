import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Wrench, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Share, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AllOEMManuals Web App — Install Factory Repair Manuals on Mobile & PC',
  description: 'Install the official AllOEMManuals Web App for 1-tap instant access to 300,000+ OEM factory service manuals, color wiring diagrams, and torque specs in your garage or shop.',
  keywords: [
    'alloemmanuals app',
    'all oem manuals app',
    'auto repair app',
    'car repair app',
    'free workshop manual app',
    'factory service manual app',
    'wiring diagram app',
    'car manual web app'
  ],
  alternates: {
    canonical: 'https://alloemmanuals.com/app',
  },
  openGraph: {
    title: 'AllOEMManuals Web App | 1-Tap Factory Service Data',
    description: 'Instant, standalone access to factory service manuals for 300K+ vehicles. Pin to your Windows taskbar or add to your phone home screen.',
    url: 'https://alloemmanuals.com/app',
    type: 'website',
  },
};

export default function AppPage() {
  return (
    <main id="main-content" className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-[#060911] via-[#090d16] to-[#04060a] text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center space-x-2 text-xs text-gray-400">
            <li>
              <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            </li>
            <li><span>/</span></li>
            <li className="text-cyan-300 font-semibold" aria-current="page">Web App</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Article Content (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Hero */}
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Progressive Web App (PWA)
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                AllOEMManuals <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">Web App</span>
              </h1>
              <p className="font-body text-lg text-gray-300 leading-relaxed max-w-2xl">
                Get full factory repair procedures, OEM torque tables, and color wiring schematics right on your engine bay tool cart or smartphone screen. Zero app store downloads, zero bloat, 100% free.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 300,000+ Vehicles
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant 1-Tap Access
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full-Screen Workshop Mode
                </span>
              </div>
            </section>

            {/* Install Guides Grid */}
            <section className="space-y-6">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white flex items-center gap-3">
                <Download className="w-6 h-6 text-cyan-400" />
                How to Install by Device
              </h2>
              <p className="text-sm text-gray-400">
                AllOEMManuals runs on modern Progressive Web App (PWA) architecture. You don’t need to download a 200MB file from an app store. Install it in under 5 seconds directly through your browser.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Windows / PC / Edge */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-cyan-500/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Windows &amp; Edge / PC</h3>
                    <p className="text-xs text-gray-400 mt-1">Best for shop tool carts &amp; laptop bays</p>
                  </div>
                  <ol className="text-xs text-gray-300 space-y-3 list-decimal list-inside leading-relaxed">
                    <li>Open <strong className="text-white">alloemmanuals.com</strong> in Microsoft Edge or Google Chrome.</li>
                    <li>Click the <strong className="text-cyan-300">App Available (Install)</strong> icon in the address bar (or click <code className="bg-white/10 px-1 rounded text-gray-200">...</code> ➔ <em>Apps</em> ➔ <em>Install AllOEMManuals</em>).</li>
                    <li>Click <strong className="text-white">Install</strong>. It launches in a borderless window and pins to your Windows Taskbar!</li>
                  </ol>
                </div>

                {/* iPhone / iPad */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-cyan-500/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">iPhone &amp; iPad (iOS)</h3>
                    <p className="text-xs text-gray-400 mt-1">Quick lookups while under the hood</p>
                  </div>
                  <ol className="text-xs text-gray-300 space-y-3 list-decimal list-inside leading-relaxed">
                    <li>Open <strong className="text-white">alloemmanuals.com</strong> in Safari.</li>
                    <li>Tap the <strong className="text-cyan-300">Share</strong> button (the square with the arrow pointing up at the bottom).</li>
                    <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
                    <li>Tap <strong className="text-cyan-300">Add</strong> in the top-right corner. The app icon appears on your home screen.</li>
                  </ol>
                </div>

                {/* Android Phone / Tablet */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-cyan-500/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Android Phone &amp; Tablet</h3>
                    <p className="text-xs text-gray-400 mt-1">Full-screen garage tablet experience</p>
                  </div>
                  <ol className="text-xs text-gray-300 space-y-3 list-decimal list-inside leading-relaxed">
                    <li>Open <strong className="text-white">alloemmanuals.com</strong> in Google Chrome.</li>
                    <li>Tap the three dots menu (<strong className="text-white">⋮</strong>) in the top-right corner.</li>
                    <li>Select <strong className="text-cyan-300">Install app</strong> (or <em>Add to Home screen</em>).</li>
                    <li>Confirm the prompt. The app installs immediately and launches without any browser bars.</li>
                  </ol>
                </div>

              </div>
            </section>

            {/* Why Mechanics Use the Web App */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <h2 className="font-display font-bold text-2xl text-white flex items-center gap-3">
                <Wrench className="w-6 h-6 text-cyan-400" />
                Built for the Garage Environment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Standalone Window
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    No accidental URL bar taps or tab switching when wearing work gloves. The app stays locked onto your vehicle diagram or step procedure.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Fast Specification Lookups
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Direct access to OEM fluid capacities, oil viscosity grades, lug nut torque specs, and fuse box locations with sub-second page loads.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> High-Resolution Wiring Schematics
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Pinch-to-zoom interactive color wiring diagrams, circuit tracing, and connector pinouts designed to be clear on small phone screens and shop monitors.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Complete Corpus Coverage
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Unified access across vintage, modern, and late-model vehicles (1960–2026), from classic Ford trucks to modern hybrids and EVs.
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Launch Hubs */}
            <section className="space-y-4">
              <h2 className="font-display font-bold text-xl text-white">Start Browsing the Manuals</h2>
              <p className="text-xs text-gray-400">Jump straight to our primary data hubs:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href="/vehicles" className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/50 hover:bg-cyan-500/[0.05] transition-all text-center space-y-1 group">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300">Vehicle Index</div>
                  <div className="text-[11px] text-gray-400">300K+ Models</div>
                </Link>
                <Link href="/wiring" className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/50 hover:bg-cyan-500/[0.05] transition-all text-center space-y-1 group">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300">Wiring Diagrams</div>
                  <div className="text-[11px] text-gray-400">Interactive Circuits</div>
                </Link>
                <Link href="/codes" className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/50 hover:bg-cyan-500/[0.05] transition-all text-center space-y-1 group">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300">DTC Code Library</div>
                  <div className="text-[11px] text-gray-400">Diagnostic Codes</div>
                </Link>
                <Link href="/maintenance" className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/50 hover:bg-cyan-500/[0.05] transition-all text-center space-y-1 group">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300">Maintenance Specs</div>
                  <div className="text-[11px] text-gray-400">Fluids, Belts &amp; Bulbs</div>
                </Link>
              </div>
            </section>

          </div>

          {/* Sidebar (lg:col-span-4) — Mediavine Ad & Quick Actions */}
          <aside id="sidebar" className="sidebar lg:col-span-4 space-y-6">
            <div id="sidebar-sticky" className="sticky top-24 space-y-6 sidebar-sticky">
              
              {/* Install Callout Box */}
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-blue-950/20 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-white">Instant App Access</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  No subscription needed. Keep AllOEMManuals on your home screen or tool-cart laptop for immediate access when diagnosing trouble codes and checking torque specs.
                </p>
                <Link
                  href="/vehicles"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold text-xs transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Find Your Vehicle <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Service Details Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3 text-xs text-gray-400">
                <div className="flex items-center justify-between text-gray-300 border-b border-white/10 pb-2">
                  <span>App Type</span>
                  <span className="font-semibold text-cyan-300">Progressive Web App (PWA)</span>
                </div>
                <div className="flex items-center justify-between text-gray-300 border-b border-white/10 pb-2">
                  <span>Compatibility</span>
                  <span className="font-medium text-white">Windows, iOS, Android, macOS</span>
                </div>
                <div className="flex items-center justify-between text-gray-300 border-b border-white/10 pb-2">
                  <span>Download Size</span>
                  <span className="font-medium text-emerald-400">0 MB (Zero App Store Bloat)</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Cost</span>
                  <span className="font-semibold text-white">100% Free Public Access</span>
                </div>
              </div>

              {/* Mediavine Placeholder Container for Desktop Sticky Rail */}
              <div 
                id="mediavine-app-sidebar" 
                className="w-full min-h-[250px] rounded-xl flex items-center justify-center text-xs text-gray-600"
                aria-hidden="true"
              >
                {/* Mediavine ad engine injects into sidebar container */}
              </div>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
