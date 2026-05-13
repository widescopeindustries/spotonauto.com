import AffiliateLink from '@/components/AffiliateLink';
import type { ToolPage } from '@/data/tools-pages';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { getToolSpecHighlights } from '@/lib/toolIntentOffers';
import { Wrench, Package, AlertCircle } from 'lucide-react';

interface ToolIntentCommerceProps {
  page: ToolPage;
}

interface ForgottenItem {
  name: string;
  why: string;
  query: string;
}

// The things people always forget, by tool type
const FORGOTTEN_ITEMS: Record<string, ForgottenItem[]> = {
  'oil-type': [
    { name: 'Drain Plug Crush Washer', why: 'Reusing the old washer is the #1 cause of oil leaks after a DIY change.', query: 'drain plug crush washer' },
    { name: 'Oil Filter Wrench', why: 'Hand-tightened filters become impossible to remove after 5,000 miles of heat cycles.', query: 'oil filter wrench' },
  ],
  'coolant-type': [
    { name: 'Spill-Free Funnel', why: 'Without it, you trap air in the heater core and get intermittent heat.', query: 'spill free coolant funnel' },
    { name: 'Distilled Water', why: 'Tap water has minerals that corrode aluminum radiators. Always use distilled.', query: 'distilled water gallon' },
  ],
  'transmission-fluid-type': [
    { name: 'Fluid Transfer Pump', why: 'Most modern transmissions have no dipstick — you fill from below with a pump.', query: 'transmission fluid transfer pump' },
    { name: 'Drain Plug Washer', why: 'ATF drain plugs use soft aluminum washers that deform and leak if reused.', query: 'transmission drain plug washer' },
  ],
  'spark-plug-type': [
    { name: 'Torque Wrench (3/8")', why: 'Spark plug threads strip easily in aluminum heads. Torque to spec, never guess.', query: '3/8 inch torque wrench' },
    { name: 'Anti-Seize Compound', why: 'Iridium plugs can weld to the head after 100,000 km. A dab of anti-seize prevents it.', query: 'anti seize lubricant spark plug' },
  ],
  'tire-size': [
    { name: 'TPMS Valve Stem Kit', why: 'Rubber valve stems degrade over time. Replace them when mounting new tires.', query: 'tpms valve stem kit' },
    { name: 'Tire Pressure Gauge (Digital)', why: 'Gas station gauges are often 5+ PSI off. A digital gauge pays for itself.', query: 'digital tire pressure gauge' },
  ],
  'battery-location': [
    { name: 'OBD2 Memory Saver', why: 'Without it, you lose radio presets, seat positions, and idle learn data.', query: 'obd2 memory saver battery' },
    { name: 'Terminal Cleaner Brush', why: 'Corrosion under the terminal clamp causes hard starts and voltage drops.', query: 'battery terminal cleaner brush' },
  ],
  'serpentine-belt': [
    { name: 'Belt Tensioner', why: 'A weak tensioner ruins a new belt in 2,000 miles. Replace both together.', query: 'serpentine belt tensioner' },
    { name: 'Breaker Bar', why: 'Tensioners need 40+ lb-ft of torque to release. A ratchet will not cut it.', query: 'breaker bar 1/2 inch' },
  ],
  'headlight-bulb': [
    { name: 'Dielectric Grease', why: 'Moisture corrodes bulb connectors. Grease prevents the "one headlight out" problem.', query: 'dielectric grease bulb connector' },
    { name: 'Nitrile Gloves', why: 'Skin oils create hot spots on halogen glass that cause early bulb failure.', query: 'nitrile gloves automotive' },
  ],
  'wiper-blade-size': [
    { name: 'Rain-X Glass Treatment', why: 'New blades + treated glass = water beads off at 35 MPH without running wipers.', query: 'rain x glass treatment' },
    { name: 'Wiper Arm Puller', why: 'Wiper arms seize to the spline after years of salt and corrosion.', query: 'wiper arm removal tool' },
  ],
  'brake-fluid-type': [
    { name: 'Brake Bleeder Kit', why: 'One-person brake bleeding is impossible without a check-valve bleeder bottle.', query: 'brake bleeder bottle one man' },
    { name: 'Line Wrench Set', why: 'Open-end wrenches round off brake line fittings. Line wrenches grip all 6 flats.', query: 'line wrench set metric' },
  ],
  'fluid-capacity': [
    { name: 'Long-Neck Funnel', why: 'Transmission and differential fill holes are recessed. A short funnel makes a mess.', query: 'long neck funnel automotive' },
    { name: 'Fluid Extraction Pump', why: 'Removing old brake fluid from the reservoir without a pump contaminates the master cylinder.', query: 'brake fluid extractor pump' },
  ],
};

function getPrimaryOffer(page: ToolPage): { title: string; query: string; subtitle: string } | null {
  const vehicle = `${page.make} ${page.model}`;
  const highlights = getToolSpecHighlights(page, 2);
  const mainSpec = highlights[0];

  switch (page.toolType) {
    case 'oil-type': {
      const viscosity = mainSpec?.value.match(/\b\d{1,2}W-\d{1,2}\b/)?.[0] || '';
      return {
        title: `${vehicle} ${viscosity} Oil + Filter`,
        query: `${vehicle} ${viscosity} motor oil filter kit`,
        subtitle: viscosity
          ? `The factory spec is ${viscosity}. Buy the exact oil and matching filter in one shot.`
          : `Buy the correct oil and matching filter for your ${vehicle}.`,
      };
    }
    case 'coolant-type': {
      const coolantType = mainSpec?.value.match(/\b(Dex-Cool|OAT|HOAT|G12|G13|Super Long Life)\b/i)?.[0] || 'coolant';
      return {
        title: `${vehicle} ${coolantType}`,
        query: `${vehicle} ${coolantType} coolant antifreeze`,
        subtitle: `Get the exact coolant chemistry your ${vehicle} needs. Wrong coolant = sludge and overheating.`,
      };
    }
    case 'transmission-fluid-type': {
      return {
        title: `${vehicle} Transmission Fluid`,
        query: `${vehicle} transmission fluid ATF`,
        subtitle: `Wrong ATF destroys transmissions. Get the exact spec for your ${vehicle}.`,
      };
    }
    case 'spark-plug-type': {
      const plugType = mainSpec?.value.match(/\b(Iridium|Platinum|Copper)\b/i)?.[0] || 'Spark Plugs';
      return {
        title: `${vehicle} ${plugType} Plugs`,
        query: `${vehicle} ${plugType} spark plugs set`,
        subtitle: `Buy the exact plugs with the right heat range and gap. Don't guess on spark plugs.`,
      };
    }
    case 'tire-size': {
      const size = mainSpec?.value.match(/\b\d{3}\/\d{2,3}[RZ]\d{2}\b/)?.[0] || '';
      return {
        title: size ? `${vehicle} Tires — ${size}` : `${vehicle} Tires`,
        query: size ? `${vehicle} tires ${size}` : `${vehicle} tires OEM`,
        subtitle: size
          ? `Confirmed size: ${size}. Match the speed rating and load index on your door jamb sticker.`
          : `Find the exact OEM tire size for your ${vehicle}.`,
      };
    }
    case 'battery-location': {
      const groupSize = mainSpec?.value.match(/\bGroup\s+\w+\b/i)?.[0] || '';
      return {
        title: groupSize ? `${vehicle} ${groupSize} Battery` : `${vehicle} Replacement Battery`,
        query: groupSize ? `${vehicle} ${groupSize} AGM battery` : `${vehicle} automotive battery AGM`,
        subtitle: groupSize
          ? `Your ${vehicle} needs a ${groupSize} battery. AGM is strongly recommended for modern charging systems.`
          : `Get the correct battery size and type for your ${vehicle}.`,
      };
    }
    case 'serpentine-belt': {
      return {
        title: `${vehicle} Serpentine Belt`,
        query: `${vehicle} serpentine belt drive belt`,
        subtitle: `Match the exact belt length and rib count for your ${vehicle} engine.`,
      };
    }
    case 'headlight-bulb': {
      return {
        title: `${vehicle} Headlight Bulbs`,
        query: `${vehicle} headlight bulbs LED halogen`,
        subtitle: `Get the right bulb type and connector for your ${vehicle}. Never touch halogen glass with bare hands.`,
      };
    }
    case 'wiper-blade-size': {
      return {
        title: `${vehicle} Wiper Blades`,
        query: `${vehicle} wiper blades windshield`,
        subtitle: `Buy the exact driver and passenger side lengths. Most use standard J-hook connectors.`,
      };
    }
    case 'brake-fluid-type': {
      const dot = mainSpec?.value.match(/DOT\s*\d/i)?.[0] || 'brake fluid';
      return {
        title: `${vehicle} ${dot} Brake Fluid`,
        query: `${vehicle} ${dot} brake fluid`,
        subtitle: `Brake fluid absorbs moisture over time. Fresh fluid every 2-3 years prevents corrosion and pedal fade.`,
      };
    }
    case 'fluid-capacity': {
      return {
        title: `${vehicle} Fluid Service Kit`,
        query: `${vehicle} fluid service kit oil coolant transmission`,
        subtitle: `Buy all the fluids your ${vehicle} needs in one cart.`,
      };
    }
    default:
      return null;
  }
}

export default function ToolIntentCommerce({ page }: ToolIntentCommerceProps) {
  const primary = getPrimaryOffer(page);
  const forgotten = FORGOTTEN_ITEMS[page.toolType] || [];
  const vehicleName = `${page.make} ${page.model}`;
  const subtag = `tool-intent-${page.toolType}`;

  if (!primary) return null;

  return (
    <section className="mb-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      {/* Header — Manual's voice */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
          <Wrench size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Manual already checked Amazon for you
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            You came here for the exact spec. Now here is the exact part — plus the two things
            people always forget and have to run back to the store for.
          </p>
        </div>
      </div>

      {/* Primary offer — the thing they came for */}
      <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package size={16} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                The Exact Part
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-white">{primary.title}</h3>
            <p className="mt-1 text-sm text-gray-300">{primary.subtitle}</p>
          </div>
          <AffiliateLink
            href={buildAmazonSearchUrl(`${vehicleName} ${primary.query}`, 'automotive', subtag)}
            partName={primary.title}
            vehicle={vehicleName}
            pageType="parts_page"
            subtag={subtag}
            className="shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400"
          >
            Get This Sorted →
          </AffiliateLink>
        </div>
      </div>

      {/* Forgotten items — the things they don't know they need */}
      {forgotten.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
              The 2 things people always forget
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {forgotten.map((item) => (
              <AffiliateLink
                key={item.name}
                href={buildAmazonSearchUrl(`${vehicleName} ${item.query}`, 'automotive', `${subtag}-forgotten`)}
                partName={item.name}
                vehicle={vehicleName}
                pageType="parts_page"
                subtag={`${subtag}-forgotten`}
                className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-rose-500/30 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                    {item.name}
                  </h4>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-rose-500/60 group-hover:text-rose-500 transition-colors">
                    Shop →
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  {item.why}
                </p>
              </AffiliateLink>
            ))}
          </div>
        </div>
      )}

      {/* Trust footer */}
      <p className="text-xs text-gray-500">
        We earn a small commission if you buy through these links — at zero extra cost to you.
        We only suggest items that match the factory specs on this page.
      </p>
    </section>
  );
}
