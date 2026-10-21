import Link from 'next/link';
import Image from 'next/image';
import { Cpu, Zap, Car, BookOpen, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { COMPANY_INFO, formatBusinessAddress } from '@/lib/companyInfo';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative border-t border-white/5 bg-[#050507]/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center mb-4">
                            <Image
                                src="/logo.png"
                                alt="AllOEMManuals"
                                width={200}
                                height={83}
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                            Factory service manual data for 300,000+ vehicles — the same specifications dealership technicians rely on.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 text-xs font-mono rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                100% Free
                            </span>
                            <span className="px-2.5 py-1 text-xs font-mono rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                No Login Required
                            </span>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 leading-5">
                            {formatBusinessAddress()}
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Tools</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/diagnose', label: 'Ask Manuel', icon: Zap },
                                { href: '/manual', label: 'Factory Manuals', icon: BookOpen },
                                { href: '/repair', label: 'Repair Guides', icon: BookOpen },
                                { href: '/parts', label: 'Parts Finder', icon: Car },
                                { href: '/codes', label: 'DTC Code Lookup', icon: Shield },
                                { href: '/wiring', label: 'Wiring Diagrams', icon: Cpu },
                            ].map((item) => (
                                <li key={item.href + item.label}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-sky-400 transition-colors"
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
                        <h3 className="text-sm font-semibold text-white mb-4">Popular Repairs</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/repair', label: 'Oil Change Guides' },
                                { href: '/repair', label: 'Brake Pad Guides' },
                                { href: '/repair', label: 'Battery Guides' },
                                { href: '/repair', label: 'Spark Plug Guides' },
                                { href: '/repair', label: 'Serpentine Belt Guides' },
                                { href: '/repair', label: 'All Repair Categories →' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-gray-400 hover:text-sky-400 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/about', label: 'About Us' },
                                { href: '/developers', label: 'API / Developers' },
                                { href: '/auth', label: 'Sign In / Sign Up' },
                                { href: '/privacy-policy', label: 'Privacy Policy' },
                                { href: '/terms-of-service', label: 'Terms of Service' },
                                { href: '/disclaimer', label: 'Disclaimer' },
                                { href: '/disclosure', label: 'Affiliate Disclosure' },
                                { href: '/contact', label: 'Contact Us' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-gray-400 hover:text-sky-400 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                            <a
                                href={COMPANY_INFO.phoneTel}
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-sky-400 transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                {COMPANY_INFO.phoneDisplay}
                            </a>
                            <a
                                href={`mailto:${COMPANY_INFO.supportEmail}`}
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-sky-400 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                {COMPANY_INFO.supportEmail}
                            </a>
                            <p className="flex items-start gap-2 text-xs text-gray-400">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Review CTA */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="max-w-xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                            <span className="text-green-400 text-sm">★★★★★</span>
                            <span className="text-green-300 text-xs font-semibold uppercase tracking-wider">Help us grow</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Found AllOEMManuals helpful?
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            A 30-second review on Google helps other DIYers find exact repair guides for their cars.
                        </p>
                        <a
                            href={COMPANY_INFO.googleReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition"
                        >
                            <span>★</span>
                            Leave a 5-Star Review on Google
                            <span>★</span>
                        </a>
                        <p className="mt-3 text-xs text-gray-400">
                            Veteran-owned &amp; SDVOSB-certified — your feedback keeps this resource free.
                        </p>
                    </div>
                </div>

                {/* SDVOSB Branding */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs font-mono text-slate-400">
                        SDVOSB Certified &bull; Veteran-Owned &amp; Operated &bull; Streetman, Texas
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/about"
                            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-mono font-semibold tracking-wide text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                            About Widescope Industries LLC
                        </Link>
                        <a
                            href={COMPANY_INFO.sbaVerificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-mono font-semibold tracking-wide text-sky-400 hover:bg-sky-500/20 transition-colors"
                            aria-label="Verify SDVOSB certification with SBA"
                        >
                            Verify SDVOSB on SBA
                        </a>
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                        {COMPANY_INFO.legalName} • {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                    </p>
                </div>

                {/* Network Sister Sites */}
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">
                        Widescope Industries Network
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
                        <a
                            href="https://whattypeofoil.com"
                            target="_blank"
                            rel="nofollow noopener"
                            className="text-amber-400/90 hover:text-amber-300 underline transition-colors"
                        >
                            WhatTypeOfOil.com — Oil Spec &amp; Capacity
                        </a>
                        <span className="text-gray-600">&bull;</span>
                        <a
                            href="https://whattiresfitmy.com"
                            target="_blank"
                            rel="nofollow noopener"
                            className="text-cyan-400/90 hover:text-cyan-300 underline transition-colors"
                        >
                            WhatTiresFitMy.com — Tire Size &amp; Fitment
                        </a>
                        <span className="text-gray-600">&bull;</span>
                        <a
                            href="https://whatwipersfitmy.com"
                            target="_blank"
                            rel="nofollow noopener"
                            className="text-sky-400/90 hover:text-sky-300 underline transition-colors"
                        >
                            WhatWipersFitMy.com — Wiper Blade Sizes
                        </a>
                        <span className="text-gray-600">&bull;</span>
                        <a
                            href="https://whatbulbfitsmy.com"
                            target="_blank"
                            rel="nofollow noopener"
                            className="text-yellow-400/90 hover:text-yellow-300 underline transition-colors"
                        >
                            WhatBulbFitsMy.com — Light Bulb Sizes
                        </a>
                    </div>
                </div>

                {/* Affiliate Disclosure */}
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-400">
                        As an Amazon Associate, AllOEMManuals earns from qualifying purchases.
                        We also earn commissions from TOPDON purchases via our referral links.{' '}
                        <Link href="/disclosure" className="text-gray-400 hover:text-sky-400 underline transition-colors">Full disclosure</Link>.
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                        Full sitemap: <Link href="/sitemap.xml" className="underline hover:text-sky-400">sitemap.xml</Link>
                    </p>
                </div>

                {/* Bottom bar */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400">
                        © {year} AllOEMManuals. All rights reserved. Factory service data verified by our mechanic review team.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">OEM-sourced repair data</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-400">Verified coverage index active</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
