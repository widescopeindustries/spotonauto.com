import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import type { ToolPage } from '@/data/tools-pages';
import type { AmazonCtaVariant } from '@/lib/abTests';
import { getAmazonCtaLabel } from '@/lib/abTests';
import AffiliateLink from '@/components/AffiliateLink';
import { Package, ArrowRight } from 'lucide-react';

interface PartsListItem {
  name: string;
  description: string;
  query: string;
}

interface PartsListConfig {
  heading: string;
  subtitle: string;
  items: (make: string, model: string, specHint: string) => PartsListItem[];
}

const PARTS_LISTS: Record<string, PartsListConfig> = {
  'oil-type': {
    heading: "Oil Change — Manual's Parts List",
    subtitle: 'Everything for one clean oil change. No extra trips.',
    items: (make, model, spec) => [
      { name: 'Engine Oil', description: `${spec} — get the right number of quarts`, query: `${make} ${model} ${spec} motor oil` },
      { name: 'Oil Filter', description: 'Match to your engine variant', query: `${make} ${model} oil filter` },
      { name: 'Drain Plug Crush Washer', description: 'The #1 cause of post-change leaks', query: `${make} ${model} oil drain plug gasket crush washer` },
      { name: 'Oil Filter Wrench', description: 'Hand-tightened filters seize after heat cycles', query: `oil filter wrench cap style` },
      { name: 'Shop Rags / Blue Towels', description: '6-pack — you will use more than you think', query: `shop towels blue automotive 6 pack` },
    ],
  },
  'coolant-type': {
    heading: "Coolant Service — Manual's Parts List",
    subtitle: 'Flush or top-off — here is exactly what you need.',
    items: (make, model, spec) => [
      { name: 'Engine Coolant', description: `${spec} — verify concentrate vs pre-mixed`, query: `${make} ${model} ${spec} coolant antifreeze` },
      { name: 'Distilled Water', description: 'If using concentrate — never use tap water', query: `distilled water gallon` },
      { name: 'Spill-Free Funnel', description: 'Bleeds air from the heater core automatically', query: `spill free coolant funnel kit` },
      { name: 'Hose Clamp Pliers', description: 'Spring clamps are a pain without these', query: `hose clamp pliers coolant` },
      { name: 'Shop Rags', description: 'Coolant is slippery — clean spills immediately', query: `shop towels automotive` },
    ],
  },
  'transmission-fluid-type': {
    heading: "Transmission Fluid — Manual's Parts List",
    subtitle: 'Wrong fluid destroys transmissions. Get the exact spec.',
    items: (make, model, spec) => [
      { name: 'Transmission Fluid', description: `${spec} — ATF or CVT, exact spec only`, query: `${make} ${model} ${spec} transmission fluid ATF` },
      { name: 'Drain Plug Washer', description: 'Soft aluminum — reuse it and it will leak', query: `${make} ${model} transmission drain plug washer gasket` },
      { name: 'Fluid Transfer Pump', description: 'No dipstick on modern transmissions — fill from below', query: `transmission fluid transfer pump hand pump` },
      { name: 'Shop Rags', description: 'ATF stains everything', query: `shop towels automotive` },
    ],
  },
  'spark-plug-type': {
    heading: "Spark Plugs — Manual's Parts List",
    subtitle: 'Exact plugs, exact torque, no stripped threads.',
    items: (make, model, spec) => [
      { name: 'Spark Plugs', description: `${spec} — buy the full set, not one at a time`, query: `${make} ${model} ${spec} spark plugs set of 4` },
      { name: 'Torque Wrench (3/8")', description: 'Aluminum heads strip at 18 ft-lbs — torque, do not guess', query: `3/8 inch torque wrench 10-80 ft lb` },
      { name: 'Spark Plug Socket', description: 'Magnetic or rubber insert — protects the ceramic', query: `spark plug socket 5/8 magnetic` },
      { name: 'Anti-Seize Compound', description: 'A dab on the threads prevents the 100k-mile weld', query: `anti seize lubricant spark plug nickel` },
      { name: 'Dielectric Grease', description: 'On the boot — prevents misfires from moisture', query: `dielectric grease silicone packet` },
    ],
  },
  'tire-size': {
    heading: "Tires — Manual's Parts List",
    subtitle: 'Exact size, exact pressure, ready to roll.',
    items: (make, model, spec) => [
      { name: 'Tires', description: `${spec} — match speed rating and load index from door sticker`, query: `${make} ${model} tires ${spec}` },
      { name: 'TPMS Valve Stem Kit', description: 'Replace rubber valves when mounting new tires', query: `tpms valve stem kit rubber snap in` },
      { name: 'Digital Tire Pressure Gauge', description: 'Gas station gauges are usually 5+ PSI off', query: `digital tire pressure gauge accurate` },
      { name: 'Portable Air Compressor', description: 'Inflate at home instead of driving to the gas station', query: `portable tire inflator 12v` },
    ],
  },
  'battery-location': {
    heading: "Battery — Manual's Parts List",
    subtitle: 'The right battery, the right tools, no lost settings.',
    items: (make, model, spec) => [
      { name: 'Replacement Battery', description: `${spec} — AGM strongly recommended for modern cars`, query: `${make} ${model} ${spec} AGM battery` },
      { name: 'OBD2 Memory Saver', description: 'Keeps radio presets, seat memory, idle learn data', query: `obd2 memory saver battery replacement` },
      { name: 'Terminal Cleaner Brush', description: 'Corrosion under the clamp causes voltage drop', query: `battery terminal cleaner brush tool` },
      { name: 'Battery Terminal Protector Spray', description: 'Prevents the green crust from coming back', query: `battery terminal protector spray` },
    ],
  },
  'serpentine-belt': {
    heading: "Serpentine Belt — Manual's Parts List",
    subtitle: 'Belt, tensioner, and the tool to do it right.',
    items: (make, model, spec) => [
      { name: 'Serpentine Belt', description: 'Exact length and rib count for your engine', query: `${make} ${model} serpentine belt drive belt` },
      { name: 'Belt Tensioner', description: 'A weak tensioner ruins a new belt in 2,000 miles', query: `${make} ${model} serpentine belt tensioner assembly` },
      { name: 'Idler Pulley', description: 'If it wobbles or squeaks, replace it while you are in there', query: `${make} ${model} idler pulley drive belt` },
      { name: 'Breaker Bar (1/2")', description: 'Tensioners need leverage — a ratchet will not cut it', query: `breaker bar 1/2 inch 24 inch` },
      { name: 'Belt Routing Diagram', description: 'Take a photo before you remove the old belt', query: `serpentine belt routing sticker` },
    ],
  },
  'headlight-bulb': {
    heading: "Headlight Bulbs — Manual's Parts List",
    subtitle: 'The right bulbs, handled clean.',
    items: (make, model, spec) => [
      { name: 'Headlight Bulbs', description: `${spec} — low beam and high beam if needed`, query: `${make} ${model} headlight bulbs ${spec}` },
      { name: 'Nitrile Gloves', description: 'Skin oils create hot spots on halogen glass', query: `nitrile gloves powder free medium` },
      { name: 'Dielectric Grease', description: 'On the connector — prevents corrosion and flickering', query: `dielectric grease bulb connector packet` },
    ],
  },
  'wiper-blade-size': {
    heading: "Wiper Blades — Manual's Parts List",
    subtitle: 'Exact sizes, clean install.',
    items: (make, model, spec) => [
      { name: 'Wiper Blades', description: `${spec} — driver and passenger side`, query: `${make} ${model} wiper blades ${spec}` },
      { name: 'Rain-X Glass Treatment', description: 'New blades + treated glass = water beads off at 35 MPH', query: `rain x glass treatment original` },
      { name: 'Wiper Fluid Tablets', description: 'Drop one in a gallon of water — better than blue juice', query: `windshield washer fluid tablets concentrated` },
    ],
  },
  'brake-fluid-type': {
    heading: "Brake Fluid — Manual's Parts List",
    subtitle: 'Fresh fluid, clean bleed, firm pedal.',
    items: (make, model, spec) => [
      { name: 'Brake Fluid', description: `${spec} — get 2 bottles, you will need more than one`, query: `${make} ${model} ${spec} brake fluid` },
      { name: 'One-Man Brake Bleeder Bottle', description: 'Check valve lets you bleed solo without air bubbles', query: `brake bleeder bottle one man valve` },
      { name: 'Line Wrench Set', description: 'Open-end wrenches round off flare fittings — use line wrenches', query: `line wrench set metric brake flare` },
      { name: 'Shop Rags', description: 'Brake fluid strips paint — wipe spills immediately', query: `shop towels automotive` },
    ],
  },
  'fluid-capacity': {
    heading: "Fluids — Manual's Parts List",
    subtitle: 'Everything for a full fluid service weekend.',
    items: (make, model, spec) => [
      { name: 'Engine Oil', description: 'Match viscosity to your spec', query: `${make} ${model} motor oil` },
      { name: 'Coolant', description: 'Match color/chemistry — never mix types', query: `${make} ${model} coolant antifreeze` },
      { name: 'Long-Neck Funnel', description: 'Transmission and differential fill holes are recessed', query: `long neck funnel automotive transmission` },
      { name: 'Fluid Extraction Pump', description: 'Remove old brake fluid from reservoir without mess', query: `fluid extractor pump hand vacuum automotive` },
      { name: 'Shop Rags', description: 'You will need more than you think', query: `shop towels automotive 6 pack` },
    ],
  },
};

function extractSpecHint(page: ToolPage): string {
  const gen = page.generations[0];
  if (!gen) return '';
  const firstValue = Object.values(gen.specs)[0] || '';
  // Pull out the most specific part: viscosity, tire size, DOT rating, etc.
  const viscosity = firstValue.match(/\b\d{1,2}W-\d{1,2}\b/i)?.[0];
  if (viscosity) return viscosity;
  const tireSize = firstValue.match(/\b\d{3}\/\d{2,3}[RZ]\d{2}\b/)?.[0];
  if (tireSize) return tireSize;
  const dot = firstValue.match(/DOT\s*\d/i)?.[0];
  if (dot) return dot;
  const group = firstValue.match(/\bGroup\s+\w+\b/i)?.[0];
  if (group) return group;
  const plugType = firstValue.match(/\b(Iridium|Platinum|Copper)\b/i)?.[0];
  if (plugType) return plugType;
  const coolantType = firstValue.match(/\b(Dex-Cool|OAT|HOAT|G12|G13|Super Long Life)\b/i)?.[0];
  if (coolantType) return coolantType;
  return firstValue.slice(0, 30);
}

export default function ManualPartsList({ page, ctaVariant = 'A' }: { page: ToolPage; ctaVariant?: AmazonCtaVariant }) {
  const config = PARTS_LISTS[page.toolType];
  if (!config) return null;

  const specHint = extractSpecHint(page);
  const items = config.items(page.make, page.model, specHint);
  const vehicleName = `${page.make} ${page.model}`;
  const subtag = `tool-parts-${page.toolType}-v${ctaVariant}`;

  // Build a compiled "all at once" search query
  const compiledQuery = items.map(i => i.query.replace(new RegExp(`${vehicleName}\\s*`, 'i'), '')).join(' ');
  const compiledUrl = buildAmazonSearchUrl(`${vehicleName} ${compiledQuery}`.slice(0, 400), 'automotive', `${subtag}-compiled`);

  return (
    <section className="mb-12 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 md:p-8 backdrop-blur-md transition-all duration-300 hover:border-white/15">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Package size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">{config.heading}</h2>
          <p className="mt-1 text-sm text-gray-400 leading-relaxed">{config.subtitle}</p>
        </div>
      </div>

      <div className="mb-6 relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.08] to-cyan-500/[0.02] p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] group/banner">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Vehicle-Scoped Amazon Search</p>
            <p className="mt-1.5 text-sm text-gray-300 leading-relaxed max-w-2xl">
              Opens Amazon with {vehicleName} prefilled so you can confirm fitment and avoid wrong parts.
            </p>
          </div>
          <AffiliateLink
            href={compiledUrl}
            partName={`${vehicleName} ${config.heading}`}
            vehicle={vehicleName}
            pageType="parts_page"
            subtag={`${subtag}-compiled`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-black shadow-[0_4px_12px_rgba(6,182,212,0.15)] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_4px_18px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] group/btn"
          >
            {getAmazonCtaLabel(ctaVariant)}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
          </AffiliateLink>
        </div>
      </div>

      {/* Parts List */}
      <ul className="space-y-0 divide-y divide-white/5">
        {items.map((item, i) => {
          const url = buildAmazonSearchUrl(item.query, 'automotive', `${subtag}-${i}`);
          return (
            <li key={i} className="flex items-center gap-4 py-4 group transition-all duration-200">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs font-bold text-gray-500 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/25 group-hover:text-cyan-400 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <AffiliateLink
                  href={url}
                  partName={item.name}
                  vehicle={vehicleName}
                  pageType="parts_page"
                  subtag={`${subtag}-${i}`}
                  className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                >
                  {item.name}
                </AffiliateLink>
                <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
              </div>
              <AffiliateLink
                href={url}
                partName={`${item.name} quick shop`}
                vehicle={vehicleName}
                pageType="parts_page"
                subtag={`${subtag}-${i}-quick`}
                className="shrink-0 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-bold text-gray-300 bg-white/[0.01] hover:bg-cyan-400 hover:text-black hover:border-cyan-400 hover:shadow-[0_2px_10px_rgba(6,182,212,0.15)] transition-all duration-300 active:scale-95"
              >
                Shop →
              </AffiliateLink>
            </li>
          );
        })}
      </ul>

      {/* Compiled cart link */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.06] to-transparent p-5 backdrop-blur-md">
        <div>
          <p className="text-sm font-bold text-white">Get everything at once</p>
          <p className="text-xs text-gray-500">One search shows all of the above on a single page.</p>
        </div>
        <AffiliateLink
          href={compiledUrl}
          partName={`${vehicleName} full parts list`}
          vehicle={vehicleName}
          pageType="parts_page"
          subtag={`${subtag}-compiled-footer`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black shadow-[0_4px_12px_rgba(245,158,11,0.15)] transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_4px_18px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] group/footer-btn"
        >
          See All on Amazon
          <ArrowRight size={16} className="transition-transform duration-300 group-hover/footer-btn:translate-x-0.5" />
        </AffiliateLink>
      </div>

      <p className="mt-4 text-xs text-gray-600">
        Links go to Amazon via our affiliate store (aiautorepair-20). We earn a small commission
        at no extra cost to you — it keeps the site running and the data free.
      </p>
    </section>
  );
}
