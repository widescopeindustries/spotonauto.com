import Link from 'next/link';
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
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center">
                                <Cpu className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg text-white">
                                SpotOn<span className="text-[#FF6B00]">Auto</span>
                            </span>
                        </div>
                        <p className="text-sm text-[#6E6E80] leading-relaxed mb-4">
                            AI-powered auto repair guides. Save $200–$500 per repair with step-by-step instructions tailored to your exact vehicle.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                                100% Free
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-[#5B8DB8]/10 text-[#5B8DB8] border border-[#5B8DB8]/20">
                                No Login Required
                            </span>
                        </div>
                        <p className="mt-4 text-xs text-[#6E6E80] leading-5">
                            {formatBusinessAddress()}
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Tools</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/diagnose', label: 'AI Diagnostic Chat', icon: Zap },
                                { href: '/manual', label: 'Factory Manuals', icon: BookOpen },
                                { href: '/repair', label: 'Repair Guides', icon: BookOpen },
                                { href: '/parts', label: 'Parts Finder', icon: Car },
                                { href: '/codes', label: 'DTC Code Lookup', icon: Shield },
                                { href: '/wiring', label: 'Wiring Diagrams', icon: Cpu },
                            ].map((item) => (
                                <li key={item.href + item.label}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-2 text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors"
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
                                { href: '/repairs/oil-change', label: 'Oil Change Guides' },
                                { href: '/repairs/brake-pad-replacement', label: 'Brake Pad Guides' },
                                { href: '/repairs/battery-replacement', label: 'Battery Guides' },
                                { href: '/repairs/spark-plug-replacement', label: 'Spark Plug Guides' },
                                { href: '/repairs/serpentine-belt-replacement', label: 'Serpentine Belt Guides' },
                                { href: '/repairs', label: 'All Repair Categories →' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors"
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
                                        className="text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                            <a
                                href={COMPANY_INFO.phoneTel}
                                className="flex items-center gap-2 text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                {COMPANY_INFO.phoneDisplay}
                            </a>
                            <a
                                href={`mailto:${COMPANY_INFO.supportEmail}`}
                                className="flex items-center gap-2 text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                {COMPANY_INFO.supportEmail}
                            </a>
                            <p className="flex items-start gap-2 text-xs text-[#6E6E80]">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SDVOSB Branding */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-sm text-[#FF6B00]/80">
                        SDVOSB Certified • Veteran-Owned &amp; Operated • Streetman, Texas
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/about"
                            className="inline-flex items-center rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#FF6B00] hover:bg-[#FF6B00]/20"
                        >
                            About Widescope Industries LLC
                        </Link>
                        <a
                            href={COMPANY_INFO.sbaVerificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full border border-[#5B8DB8]/30 bg-[#5B8DB8]/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#5B8DB8] hover:bg-[#5B8DB8]/20"
                            aria-label="Verify SDVOSB certification with SBA"
                        >
                            Verify SDVOSB on SBA
                        </a>
                    </div>
                    <p className="mt-3 text-xs text-[#6E6E80]">
                        {COMPANY_INFO.legalName} • {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                    </p>
                </div>

                {/* Affiliate Disclosure */}
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs text-[#6E6E80]">
                        As an Amazon Associate, SpotOnAuto earns from qualifying purchases.
                        We also earn commissions from TOPDON purchases via our referral links.{' '}
                        <Link href="/disclosure" className="text-[#6E6E80] hover:text-[#FF6B00] underline transition-colors">Full disclosure</Link>.
                    </p>
                    <p className="mt-2 text-xs text-[#6E6E80]">
                        Full sitemap: <Link href="/sitemap.xml" className="underline hover:text-[#FF6B00]">sitemap.xml</Link>
                    </p>
                </div>

                {/* Bottom bar */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#6E6E80]">
                        © {year} SpotOn Auto. All rights reserved. AI-generated content is for informational purposes only.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[#6E6E80]">AI-assisted repair guidance</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-[#6E6E80]">Verified coverage index active</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
