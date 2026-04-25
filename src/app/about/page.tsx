import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Star, Cpu, BookOpen, Phone, Mail, MapPin, Clock3, BadgeCheck } from 'lucide-react';
import { COMPANY_INFO, formatBusinessAddress } from '@/lib/companyInfo';

export const metadata: Metadata = {
  title: 'About SpotOnAuto | Veteran-Owned & SDVOSB-Certified',
  description: 'SpotOnAuto is operated by Widescope Industries LLC, an SDVOSB-certified, veteran-owned company in Streetman, Texas focused on safety-first free DIY repair guidance.',
  alternates: {
    canonical: 'https://spotonauto.com/about',
  },
};

const reasons = [
  { icon: Shield, title: 'SDVOSB Certified', desc: 'Verified through the U.S. Small Business Administration' },
  { icon: Star, title: 'Veteran-Owned & Operated', desc: 'Built with military discipline and integrity' },
  { icon: Cpu, title: 'AI-Powered Diagnostics', desc: 'Instant, accurate repair guidance for your exact vehicle' },
  { icon: BookOpen, title: '57+ Repair Guides', desc: 'Growing library of step-by-step instructions' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">SpotOnAuto</span>
          </h1>
          <p className="font-body text-lg text-gray-300 max-w-3xl mx-auto">
            SpotOnAuto is a safety-first, free DIY repair platform built by a veteran-owned company. We help drivers avoid costly mistakes and unsafe repairs with clearer, vehicle-specific guidance.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-[#D4A017]/40 bg-[#D4A017]/10 px-3 py-1 text-xs font-semibold text-[#E6C36A]">
              SDVOSB Certified
            </span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              Veteran-Owned &amp; Operated
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-gray-200">
              Streetman, Texas
            </span>
          </div>
        </section>

        {/* Verification */}
        <section className="glass rounded-2xl p-8 space-y-5 border border-[#D4A017]/30">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#D4A017]">
            SDVOSB Verification
          </h2>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <Image
                src="/about/sba-sdvosb-logo.png"
                alt="SBA Service-Disabled Veteran-Owned Small Business certification logo"
                width={170}
                height={70}
                className="h-auto w-auto"
              />
            </div>
            <div className="flex-1">
              <p className="font-body text-gray-300 leading-relaxed">
                SpotOnAuto is operated by <strong>{COMPANY_INFO.legalName}</strong>, a Service-Disabled Veteran-Owned Small Business (SDVOSB).
                You can verify our certification directly through the U.S. Small Business Administration.
              </p>
              <a
                href={COMPANY_INFO.sbaVerificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
              >
                <BadgeCheck className="h-4 w-4" />
                Verify on SBA (Official)
              </a>
            </div>
          </div>
        </section>

        {/* Founder + Team */}
        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="glass rounded-2xl border border-white/10 p-4">
            <Image
              src="/about/founder-portrait.jpg"
              alt="Founder of SpotOnAuto and Widescope Industries LLC"
              width={360}
              height={360}
              className="w-full rounded-xl object-cover"
              priority
            />
            <p className="mt-3 text-xs text-gray-400">Real team photo • Widescope Industries LLC</p>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-8">
            <h2 className="font-display font-bold text-2xl text-white">Founder &amp; Review Team</h2>
            <p className="mt-3 text-gray-300 leading-7">
              <strong>Lyndon Bedford</strong>, founder of SpotOnAuto and Widescope Industries LLC, is an Iraq War veteran
              (32nd Signal Battalion, 2003–2004) and former Army 31F (Network Switching Systems Operator Maintainer).
            </p>
            <p className="mt-3 text-gray-300 leading-7">
              After military service, he spent years doing hands-on automotive repair work and built SpotOnAuto to give
              DIYers better guidance before they commit to risky or expensive decisions.
            </p>
            <p className="mt-3 text-gray-300 leading-7">
              <strong>Guide review process:</strong> Every published repair guide goes through a human review pass by our
              veteran-led mechanic/technician review panel before publication updates are approved.
            </p>
          </div>
        </section>

        {/* Why We Built This */}
        <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.08] p-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">Why We Built This</h2>
          <p className="mt-3 text-gray-200 leading-7">
            Too many drivers get trapped between expensive shop bills and unsafe guesswork. SpotOnAuto exists to reduce that risk:
            clear steps, safety checkpoints, OEM references, and honest “stop and call a mechanic” triggers when DIY is no longer safe.
          </p>
          <p className="mt-3 text-gray-300 leading-7">
            Mission: help DIYers avoid costly mistakes and unsafe repairs while keeping core guidance free and accessible.
          </p>
        </section>

        {/* Why Choose Us */}
        <section className="space-y-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white text-center">Why Choose Us</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="glass rounded-xl p-6 space-y-3">
                <r.icon className="w-8 h-8 text-cyan-400" />
                <h3 className="font-display font-bold text-lg text-white">{r.title}</h3>
                <p className="font-body text-sm text-gray-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company Info */}
        <section className="glass rounded-2xl border border-white/10 p-8">
          <h2 className="font-display font-bold text-2xl text-white">Company Information</h2>
          <p className="mt-4 text-sm text-gray-300">{formatBusinessAddress()}</p>
          <div className="mt-5 space-y-3 text-sm">
            <a href={COMPANY_INFO.phoneTel} className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100">
              <Phone className="h-4 w-4" />
              {COMPANY_INFO.phoneDisplay}
            </a>
            <a href={`mailto:${COMPANY_INFO.supportEmail}`} className="flex items-center gap-2 text-gray-300 hover:text-cyan-100">
              <Mail className="h-4 w-4" />
              {COMPANY_INFO.supportEmail}
            </a>
            <p className="flex items-center gap-2 text-gray-300">
              <Clock3 className="h-4 w-4" />
              {COMPANY_INFO.businessHours}
            </p>
            <p className="flex items-center gap-2 text-gray-300">
              <MapPin className="h-4 w-4" />
              {COMPANY_INFO.streetAddress}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-display font-bold tracking-wider hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Start Diagnosing →
          </Link>
        </section>
      </div>
    </main>
  );
}
