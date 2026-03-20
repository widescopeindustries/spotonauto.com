'use client';

import Link from 'next/link';
import { buildSymptomHref, getSymptomClusterFromText } from '@/data/symptomGraph';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Battery,
  CircleGauge,
  Droplets,
  Flame,
  Lightbulb,
  Settings2,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Zap,
} from 'lucide-react';

type ClusterLink = {
  href: string;
  label: string;
};

type RepairCluster = {
  title: string;
  intro: string;
  savings: string;
  symptoms: string[];
  icon: ComponentType<{ className?: string }>;
  links: ClusterLink[];
  primaryHref: string;
  primaryLabel: string;
};

const REPAIR_CLUSTERS: RepairCluster[] = [
  {
    title: 'Battery and charging fixes',
    intro: 'For dead batteries, slow cranks, and battery-light complaints that usually turn into a battery, starter, or alternator job.',
    savings: 'Save $120 to $450',
    symptoms: ['Slow crank', 'Battery light', 'No-start'],
    icon: Battery,
    links: [
      { href: '/repair/2013/bmw/x3/battery-replacement', label: '2013 BMW X3 battery replacement' },
      { href: '/repair/2013/toyota/corolla/battery-replacement', label: '2013 Toyota Corolla battery replacement' },
      { href: '/repair/2012/honda/cr-v/battery-replacement', label: '2012 Honda CR-V battery replacement' },
      { href: '/repair/2009/bmw/x5/alternator-replacement', label: '2009 BMW X5 alternator replacement' },
      { href: '/repair/2007/honda/pilot/starter-replacement', label: '2007 Honda Pilot starter replacement' },
    ],
    primaryHref: buildSymptomHref('car-wont-start'),
    primaryLabel: 'Open the no-start symptom hub',
  },
  {
    title: 'Belts, cooling, and overheating',
    intro: 'High-intent jobs for squealing belts, overheating, coolant loss, and thermostat or water-pump failures.',
    savings: 'Save $180 to $900',
    symptoms: ['Squeal on startup', 'Runs hot', 'Coolant leak'],
    icon: Thermometer,
    links: [
      { href: '/repair/2009/bmw/x5/serpentine-belt-replacement', label: '2009 BMW X5 serpentine belt diagram' },
      { href: '/repair/2013/honda/odyssey/serpentine-belt-replacement', label: '2013 Honda Odyssey serpentine belt' },
      { href: '/repair/2013/bmw/x3/thermostat-replacement', label: '2013 BMW X3 thermostat replacement' },
      { href: '/repair/2013/toyota/prius/water-pump-replacement', label: '2013 Toyota Prius water pump replacement' },
      { href: '/repair/2012/chevrolet/malibu/thermostat-replacement', label: '2012 Chevy Malibu thermostat replacement' },
    ],
    primaryHref: buildSymptomHref('overheating'),
    primaryLabel: 'Open the overheating symptom hub',
  },
  {
    title: 'Brakes, tune-up, and lighting',
    intro: 'Quick-win service pages for brake noise, misfires, worn plugs, and burnt-out bulbs that can convert straight into parts research.',
    savings: 'Save $90 to $520',
    symptoms: ['Brake squeal', 'Misfire', 'Dim headlight'],
    icon: Flame,
    links: [
      { href: '/repair/2013/bmw/x3/brake-pad-replacement', label: '2013 BMW X3 rear brake pad replacement' },
      { href: '/repair/2013/honda/odyssey/spark-plug-replacement', label: '2013 Honda Odyssey spark plug replacement' },
      { href: '/repair/2012/bmw/x3/headlight-bulb-replacement', label: '2012 BMW X3 headlight bulb replacement' },
      { href: '/repair/2010/toyota/tundra/brake-pad-replacement', label: '2010 Toyota Tundra brake pad replacement' },
      { href: '/repair/2012/honda/cr-v/headlight-bulb-replacement', label: '2012 Honda CR-V headlight bulb guide' },
    ],
    primaryHref: buildSymptomHref('squeaky-brakes'),
    primaryLabel: 'Open the brake squeal symptom hub',
  },
];

const ACTIONS = [
  {
    href: '/symptoms',
    label: 'Browse symptom hubs',
    description: 'Start from the canonical symptom cluster when you know the complaint but not the exact repair yet.',
    icon: Sparkles,
  },
  {
    href: '/guides',
    label: 'Browse by make and model',
    description: 'Jump straight into the repair directory if you already know the vehicle you are working on.',
    icon: CircleGauge,
  },
  {
    href: '/parts',
    label: 'Compare common repair parts',
    description: 'Move from DIY intent to purchase intent with batteries, bulbs, belts, and other common parts.',
    icon: ShieldCheck,
  },
];

const TASK_HUB_LINKS = [
  { href: '/repairs/battery-replacement', label: 'Battery replacement guides by vehicle' },
  { href: '/repairs/alternator-replacement', label: 'Alternator replacement guides by vehicle' },
  { href: '/repairs/starter-replacement', label: 'Starter replacement guides by vehicle' },
  { href: '/repairs/brake-pad-replacement', label: 'Brake pad replacement guides by vehicle' },
  { href: '/repairs/serpentine-belt-replacement', label: 'Serpentine belt replacement guides by vehicle' },
  { href: '/repairs/thermostat-replacement', label: 'Thermostat replacement guides by vehicle' },
];

const symptomIconMap: Record<string, ComponentType<{ className?: string }>> = {
  'Battery light': Zap,
  'Brake squeal': Flame,
  'Coolant leak': Droplets,
  'Dim headlight': Lightbulb,
  'Misfire': Zap,
  'No-start': Battery,
  'Runs hot': Thermometer,
  'Slow crank': Battery,
  'Squeal on startup': Settings2,
};

export default function HomeRepairClusters() {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            High-intent repair paths
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
            Start with the repair cluster that matches the problem
          </h2>
          <p className="text-gray-400 font-body text-lg max-w-2xl">
            The homepage now routes common DIY intent into battery replacement, alternator replacement, brake pad replacement,
            serpentine belt replacement, thermostat replacement, and other repair pages that tend to convert best.
          </p>
        </div>

        <div className="grid xl:grid-cols-[1.2fr,0.8fr] gap-6 items-start">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {REPAIR_CLUSTERS.map((cluster) => {
              const Icon = cluster.icon;

              return (
                <article
                  key={cluster.title}
                  className="rounded-2xl border border-cyan-500/15 bg-white/[0.03] backdrop-blur-sm p-6 h-full flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-white mb-2">{cluster.title}</h3>
                      <p className="text-sm text-gray-400 leading-6">{cluster.intro}</p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {cluster.savings}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {cluster.symptoms.map((symptom) => {
                      const SymptomIcon = symptomIconMap[symptom] ?? Sparkles;
                      const symptomCluster = getSymptomClusterFromText(symptom);

                      return symptomCluster ? (
                        <Link
                          key={symptom}
                          href={buildSymptomHref(symptomCluster.slug)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300"
                        >
                          <SymptomIcon className="w-3.5 h-3.5 text-cyan-400" />
                          {symptom}
                        </Link>
                      ) : (
                        <span
                          key={symptom}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300"
                        >
                          <SymptomIcon className="w-3.5 h-3.5 text-cyan-400" />
                          {symptom}
                        </span>
                      );
                    })}
                  </div>

                  <div className="space-y-3 mb-6">
                    {cluster.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-gray-200 hover:border-cyan-500/35 hover:text-cyan-100 transition-all"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={cluster.primaryHref}
                    className="mt-auto inline-flex items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-500/40 transition-all"
                  >
                    <span>{cluster.primaryLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              );
            })}
          </div>

          <aside className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 via-white/[0.03] to-transparent backdrop-blur-sm p-6 lg:p-8 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-body">Best next step</span>
              <h3 className="font-display font-bold text-2xl text-white mt-3 mb-3">
                Use the shortest path from symptom to repair page
              </h3>
              <p className="text-gray-400 leading-7">
                If you are unsure whether the fix is a battery, starter, alternator, belt, or thermostat, start with diagnosis.
                If you already know the exact job, skip straight to the repair guide or compare parts before teardown.
              </p>
            </div>

            <div className="space-y-4">
              {ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="block rounded-2xl border border-white/10 bg-black/25 p-5 hover:border-cyan-500/30 hover:bg-black/35 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <span>{action.label}</span>
                          <ArrowRight className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-sm text-gray-400 mt-2 leading-6">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300 mb-3">
                Repair category hubs
              </h4>
              <p className="text-sm text-gray-400 leading-6 mb-4">
                These hub pages consolidate links to the strongest battery, alternator, starter, brake, belt, and thermostat guides across makes and models.
              </p>
              <div className="space-y-2">
                {TASK_HUB_LINKS.map((hub) => (
                  <Link
                    key={hub.href}
                    href={hub.href}
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-gray-200 hover:border-cyan-500/35 hover:text-cyan-100 transition-all"
                  >
                    <span>{hub.label}</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
