import Link from 'next/link';
import { Cpu, Zap, Car, BookOpen, Shield, Mail, MessageSquare, Phone, Clock3, MapPin } from 'lucide-react';
import { COMPANY_INFO, formatBusinessAddress } from '@/lib/companyInfo';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative border-t border-cyan-500/10 bg-black/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-6 h-6 text-cyan-400" />
                            <span className="font-display font-bold text-lg tracking-wide text-white">
                                SpotOn<span className="text-cyan-400">Auto</span>
                            </span>
                        </div>
                        <p className="font-body text-sm text-gray-500 leading-relaxed mb-4">
                            AI-powered auto repair guides. Save $200–$500 per repair with step-by-step instructions tailored to your exact vehicle.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-cyan-400 px-3 py-1.5 rounded-full">
                                100% Free
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-100 border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 rounded-full">
                                No Login Required for Most Features
                            </span>
                        </div>
                        <p className="mt-4 text-xs text-gray-500 leading-5">
                            {formatBusinessAddress()}
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <h3 className="font-display font-bold text-sm text-white tracking-wide mb-4">Tools</h3>
                        <ul className="space-y-3">
                                {[
                                    { href: '/diagnose', label: 'AI Diagnostic Chat', icon: Zap, accent: true },
                                    { href: '/manual', label: 'Factory Manuals', icon: BookOpen },
                                    { href: '/repair', label: 'Repair Guides', icon: BookOpen },
                                    { href: '/parts', label: 'Parts Finder', icon: Car },
                                { href: '/codes', label: 'Check Engine Light', icon: Shield },
                                { href: '/codes', label: 'DTC Code Lookup', icon: BookOpen },
                                { href: '/wiring', label: 'Wiring Diagrams', icon: Cpu },
                                { href: '/community', label: 'Community Forum', icon: MessageSquare },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-2 font-body text-sm transition-colors ${item.accent
                                                ? 'text-amber-400 hover:text-amber-300'
                                                : 'text-gray-400 hover:text-cyan-400'
                                            }`}
                                    >
                                        <item.icon className="w-3.5 h-3.5" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Popular Repairs */}
                    <div>
                        <h3 className="font-display font-bold text-sm text-white tracking-wide mb-4">Popular Repairs</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/repairs/oil-change', label: 'Oil Change Guides' },
                                { href: '/repairs/brake-pad-replacement', label: 'Brake Pad Guides' },
                                { href: '/repairs/battery-replacement', label: 'Battery Guides' },
                                { href: '/repairs/spark-plug-replacement', label: 'Spark Plug Guides' },
                                { href: '/repairs/serpentine-belt-replacement', label: 'Serpentine Belt Guides' },
                                { href: '/repairs/alternator-replacement', label: 'Alternator Guides' },
                                { href: '/repairs', label: 'All Repair Categories →' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-display font-bold text-sm text-white tracking-wide mb-4">Company</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/about', label: 'About Us' },
                                { href: '/auth', label: 'Sign In / Sign Up' },
                                { href: '/privacy', label: 'Privacy Policy' },
                                { href: '/terms', label: 'Terms of Service' },
                                { href: '/disclosure', label: 'Affiliate Disclosure' },
                                { href: '/contact', label: 'Contact Us' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 pt-4 border-t border-white/5">
                            <a
                                href={COMPANY_INFO.phoneTel}
                                className="mb-2 flex items-center gap-2 text-sm text-gray-300 hover:text-cyan-400 transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                {COMPANY_INFO.phoneDisplay}
                            </a>
                            <a
                                href={`mailto:${COMPANY_INFO.supportEmail}`}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                {COMPANY_INFO.supportEmail}
                            </a>
                            <p className="mt-2 flex items-start gap-2 text-xs text-gray-500">
                                <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {COMPANY_INFO.businessHours}
                            </p>
                            <p className="mt-2 flex items-start gap-2 text-xs text-gray-500">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SDVOSB Branding */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="font-body text-sm" style={{ color: '#D4A017' }}>
                        SDVOSB Certified • Veteran-Owned &amp; Operated • Streetman, Texas
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/about"
                            className="inline-flex items-center rounded-full border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#E6C36A] hover:bg-[#D4A017]/15"
                        >
                            About Widescope Industries LLC
                        </Link>
                        <a
                            href={COMPANY_INFO.sbaVerificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-100 hover:bg-cyan-500/20"
                            aria-label="Verify SDVOSB certification with SBA"
                        >
                            Verify SDVOSB on SBA
                        </a>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                        {COMPANY_INFO.legalName} • {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                    </p>
                </div>

                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.08] p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Trust Signals</p>
                    <p className="mt-2 text-sm text-cyan-50">
                        SDVOSB Certified • Veteran-Owned &amp; Operated • Streetman, Texas
                    </p>
                    <p className="mt-1 text-xs text-cyan-100/80">
                        100% Free • No Login Required for Most Features
                    </p>
                </div>

                {/* Affiliate Disclosure — Amazon Associates required statement */}
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="font-body text-xs text-gray-600">
                        As an Amazon Associate, SpotOnAuto earns from qualifying purchases.
                        We also earn commissions from TOPDON purchases via our referral links.{' '}
                        <Link href="/disclosure" className="text-gray-500 hover:text-cyan-400 underline transition-colors">Full disclosure</Link>.
                    </p>
                </div>

                {/* Bottom bar */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-body text-xs text-gray-600">
                        © {year} SpotOn Auto. All rights reserved. AI-generated content is for informational purposes only.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-700">Powered by Gemini 2.0</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-600">All systems operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
