'use client';

import React from 'react';
import AffiliateLink from './AffiliateLink';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { ShoppingCartIcon, WrenchIcon } from './Icons';

export interface PartRecommendation {
  query: string;
  label: string;
  subLabel?: string;
  category: 'part' | 'tool' | 'consumable';
}

interface SystemPartsAffiliateProps {
  /** Free-form context label, e.g. "2010 Toyota Camry headlight" */
  contextLabel: string;
  /** Optional vehicle string for cleaner query building */
  vehicle?: string;
  /** Explicit list of part recommendations */
  recommendations?: PartRecommendation[];
  /** Surface for analytics subtag */
  surface: string;
  /** Optional system slug for auto-generated recommendations */
  systemSlug?: string;
  className?: string;
}

// Wiring/electrical system → high-intent parts and tools
const WIRING_SYSTEM_PARTS: Record<string, PartRecommendation[]> = {
  headlight: [
    { query: 'headlight bulb', label: 'Headlight Bulbs', category: 'part' },
    { query: 'headlight assembly', label: 'Headlight Assembly', category: 'part' },
    { query: 'headlight wiring harness', label: 'Wiring Harness', category: 'part' },
    { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
  ],
  taillight: [
    { query: 'tail light bulb', label: 'Tail Light Bulbs', category: 'part' },
    { query: 'tail light assembly', label: 'Tail Light Assembly', category: 'part' },
    { query: 'brake light switch', label: 'Brake Light Switch', category: 'part' },
  ],
  'ac-heater': [
    { query: 'AC compressor', label: 'AC Compressor', category: 'part' },
    { query: 'blower motor', label: 'Blower Motor', category: 'part' },
    { query: 'blower motor resistor', label: 'Blower Resistor', category: 'part' },
    { query: 'cabin air filter', label: 'Cabin Air Filter', category: 'part' },
  ],
  'body-electrical': [
    { query: 'automotive fuses assortment', label: 'Assorted Fuses', category: 'part' },
    { query: 'automotive relays', label: 'Relays', category: 'part' },
    { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
    { query: 'wire crimping tool kit', label: 'Wire Repair Kit', category: 'tool' },
  ],
  'engine-electrical': [
    { query: 'alternator', label: 'Alternator', category: 'part' },
    { query: 'starter motor', label: 'Starter Motor', category: 'part' },
    { query: 'battery', label: 'Car Battery', category: 'part' },
    { query: 'spark plugs', label: 'Spark Plugs', category: 'part' },
    { query: 'ignition coils', label: 'Ignition Coils', category: 'part' },
  ],
  'charging-system': [
    { query: 'alternator', label: 'Alternator', category: 'part' },
    { query: 'battery', label: 'Car Battery', category: 'part' },
    { query: 'serpentine belt', label: 'Serpentine Belt', category: 'part' },
    { query: 'battery tester', label: 'Battery Tester', category: 'tool' },
  ],
  'starting-system': [
    { query: 'starter motor', label: 'Starter Motor', category: 'part' },
    { query: 'battery', label: 'Car Battery', category: 'part' },
    { query: 'ignition switch', label: 'Ignition Switch', category: 'part' },
  ],
  'power-window': [
    { query: 'power window regulator', label: 'Window Regulator', category: 'part' },
    { query: 'power window motor', label: 'Window Motor', category: 'part' },
    { query: 'window switch', label: 'Window Switch', category: 'part' },
  ],
  'power-door-lock': [
    { query: 'door lock actuator', label: 'Door Lock Actuator', category: 'part' },
    { query: 'key fob battery', label: 'Key Fob Battery', category: 'part' },
  ],
  'fuel-injection': [
    { query: 'fuel injectors', label: 'Fuel Injectors', category: 'part' },
    { query: 'fuel pump', label: 'Fuel Pump', category: 'part' },
    { query: 'fuel filter', label: 'Fuel Filter', category: 'part' },
    { query: 'O2 sensor', label: 'Oxygen Sensor', category: 'part' },
  ],
  abs: [
    { query: 'ABS wheel speed sensor', label: 'ABS Sensor', category: 'part' },
    { query: 'brake pads', label: 'Brake Pads', category: 'part' },
    { query: 'brake rotors', label: 'Brake Rotors', category: 'part' },
  ],
  airbag: [
    { query: 'airbag clock spring', label: 'Clock Spring', category: 'part' },
    { query: 'seat occupancy sensor', label: 'Occupancy Sensor', category: 'part' },
  ],
  instrument: [
    { query: 'instrument cluster bulbs', label: 'Cluster Bulbs', category: 'part' },
    { query: 'stepper motor instrument cluster', label: 'Stepper Motors', category: 'part' },
  ],
  radio: [
    { query: 'car stereo wiring harness', label: 'Stereo Harness', category: 'part' },
    { query: 'radio antenna adapter', label: 'Antenna Adapter', category: 'part' },
  ],
  default: [
    { query: 'automotive fuses assortment', label: 'Assorted Fuses', category: 'part' },
    { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
    { query: 'wire crimping tool kit', label: 'Wire Repair Kit', category: 'tool' },
  ],
};

function getCategoryIcon(category: PartRecommendation['category']) {
  if (category === 'tool') return <WrenchIcon className="w-3.5 h-3.5" />;
  return <ShoppingCartIcon className="w-3.5 h-3.5" />;
}

function getCategoryClasses(category: PartRecommendation['category']) {
  if (category === 'tool') {
    return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/[0.15]';
  }
  if (category === 'consumable') {
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:border-emerald-400/40 hover:bg-emerald-500/[0.15]';
  }
  return 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/[0.15]';
}

function buildRecommendations(systemSlug?: string): PartRecommendation[] {
  if (!systemSlug) return WIRING_SYSTEM_PARTS.default;
  return WIRING_SYSTEM_PARTS[systemSlug] || WIRING_SYSTEM_PARTS.default;
}

export default function SystemPartsAffiliate({
  contextLabel,
  vehicle,
  recommendations,
  surface,
  systemSlug,
  className = '',
}: SystemPartsAffiliateProps) {
  const parts = recommendations && recommendations.length > 0
    ? recommendations
    : buildRecommendations(systemSlug);

  if (parts.length === 0) return null;

  const vehiclePrefix = vehicle ? `${vehicle} ` : '';

  return (
    <section className={`rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5 text-amber-400" />
            Parts & Tools for This Job
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Common parts shoppers buy for {contextLabel}.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Amazon
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {parts.map((part) => {
          const query = `${vehiclePrefix}${part.query}`.trim();
          const subtag = `${surface}-${part.category}-${part.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return (
            <AffiliateLink
              key={part.label}
              href={buildAmazonSearchUrl(query, 'automotive', subtag)}
              partName={part.label}
              vehicle={vehicle || contextLabel}
              pageType="parts_page"
              subtag={subtag}
              className={`group block rounded-xl border p-4 transition-all ${getCategoryClasses(part.category)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {getCategoryIcon(part.category)}
                  {part.category}
                </span>
                <ShoppingCartIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                {part.label}
              </h4>
              {part.subLabel && (
                <p className="text-xs text-gray-400 mt-1">{part.subLabel}</p>
              )}
              <p className="mt-3 text-xs font-bold text-amber-300 group-hover:text-amber-200 transition-colors flex items-center gap-1">
                Shop Amazon
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </p>
            </AffiliateLink>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] text-gray-500">
        As an Amazon Associate, AllOEMManuals earns from qualifying purchases. Prices and availability may vary.
      </p>
    </section>
  );
}
