import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Star, Cpu, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About SpotOnAuto | Veteran-Owned AI Auto Repair Guides',
  description: 'SpotOnAuto is a Service-Disabled Veteran-Owned Small Business (SDVOSB) providing AI-powered automotive repair diagnosis and guides.',
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">SpotOnAuto</span>
          </h1>
          <p className="font-body text-lg text-gray-400 max-w-2xl mx-auto">
            SpotOnAuto is an AI-powered automotive repair diagnosis tool helping car owners understand check engine lights, get repair guides, and save money on auto repairs.
          </p>
        </section>

        {/* Veteran-Owned */}
        <section className="glass rounded-2xl p-8 space-y-4" style={{ borderColor: 'rgba(212, 160, 23, 0.3)', borderWidth: '1px' }}>
          <h2 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: '#D4A017' }}>
            🇺🇸 Veteran-Owned &amp; Operated
          </h2>
          <p className="font-body text-gray-300 leading-relaxed">
            SpotOnAuto is a DBA of Widescope Industries LLC, a Service-Disabled Veteran-Owned Small Business (SDVOSB) certified through the U.S. Small Business Administration. Our founder served in the United States military and brings the same discipline, integrity, and commitment to excellence to everything we build. When you work with us, you are supporting a veteran-owned business that values service above all else.
          </p>
        </section>

        {/* Mission */}
        <section className="text-center space-y-4">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">Our Mission</h2>
          <p className="font-body text-xl text-cyan-400 max-w-2xl mx-auto">
            To make auto repair knowledge accessible to everyone — no more getting overcharged at the shop.
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
