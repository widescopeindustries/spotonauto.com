import fs from 'fs';
import path from 'path';
import { buildAmazonSearchUrl } from '../src/lib/amazonAffiliate.ts';
import { getToolPage, type ToolPage, type ToolType } from '../src/data/tools-pages.ts';

type BingRow = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: string;
};

type KitItem = {
  name: string;
  note: string;
  query: string;
  role: 'required' | 'recommended';
  affiliateUrl: string;
};

type StorefrontKit = {
  slug: string;
  listName: string;
  listDescription: string;
  landingPage: string;
  source: {
    clicks: number;
    impressions: number;
    ctr: string;
    bingPageFile: string;
  };
  items: KitItem[];
};

const SEO_REPORTS_DIR = path.join(process.cwd(), 'scripts', 'seo-reports');
const BASE_URL = 'https://alloemmanuals.com';

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseBingPagesCsv(filePath: string): BingRow[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const rows: BingRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 5) continue;

    const page = cols[0].replace(/^"+|"+$/g, '');
    const clicks = Number(cols[1] || 0);
    const impressions = Number(cols[2] || 0);
    const ctr = cols[3] || '0.0%';
    const position = cols[4] || '';

    if (!page.startsWith('/tools/')) continue;
    rows.push({ page, clicks, impressions, ctr, position });
  }

  return rows;
}

function getLatestBingPagesFile(): string {
  const files = fs
    .readdirSync(SEO_REPORTS_DIR)
    .filter((f) => /^bing-pages-\d{4}-\d{2}-\d{2}\.csv$/.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error(`No bing-pages-YYYY-MM-DD.csv files found in ${SEO_REPORTS_DIR}`);
  }
  return path.join(SEO_REPORTS_DIR, files[files.length - 1]);
}

function extractSpecHint(page: ToolPage): string {
  const gen = page.generations[0];
  if (!gen) return '';
  const first = Object.values(gen.specs)[0] || '';
  const viscosity = first.match(/\b\d{1,2}W-\d{1,2}\b/i)?.[0];
  if (viscosity) return viscosity;
  const tire = first.match(/\b\d{3}\/\d{2,3}[RZ]\d{2}\b/i)?.[0];
  if (tire) return tire;
  const dot = first.match(/\bDOT\s*\d\b/i)?.[0];
  if (dot) return dot.toUpperCase();
  const group = first.match(/\bGroup\s+\w+\b/i)?.[0];
  if (group) return group;
  return first.slice(0, 36);
}

function kitTemplate(toolType: ToolType, make: string, model: string, spec: string): Array<Omit<KitItem, 'affiliateUrl'>> {
  const vehicle = `${make} ${model}`;
  const templates: Record<ToolType, Array<Omit<KitItem, 'affiliateUrl'>>> = {
    'oil-type': [
      { name: 'Engine Oil', note: `${spec || 'Correct viscosity'} and enough quarts for one service`, query: `${vehicle} ${spec} motor oil`, role: 'required' },
      { name: 'Oil Filter', note: 'Match filter to engine variant', query: `${vehicle} oil filter`, role: 'required' },
      { name: 'Drain Plug Washer', note: 'Prevents post-service seepage', query: `${vehicle} oil drain plug crush washer`, role: 'required' },
      { name: 'Oil Filter Wrench', note: 'Avoid stuck filter struggles', query: `oil filter wrench cap style`, role: 'recommended' },
      { name: 'Drain Pan + Funnel', note: 'Cleaner and faster service', query: `oil drain pan funnel kit automotive`, role: 'recommended' },
    ],
    'coolant-type': [
      { name: 'Coolant / Antifreeze', note: `${spec || 'Correct chemistry'} only`, query: `${vehicle} ${spec} coolant antifreeze`, role: 'required' },
      { name: 'Distilled Water', note: 'Required for concentrate mixes', query: `distilled water gallon`, role: 'required' },
      { name: 'Spill-Free Funnel Kit', note: 'Helps purge trapped air', query: `spill free coolant funnel kit`, role: 'recommended' },
      { name: 'Hose Clamp Pliers', note: 'Makes hose service easier', query: `hose clamp pliers coolant`, role: 'recommended' },
    ],
    'transmission-fluid-type': [
      { name: 'Transmission Fluid', note: `${spec || 'Exact ATF/CVT spec'} only`, query: `${vehicle} ${spec} transmission fluid`, role: 'required' },
      { name: 'Transmission Filter Kit', note: 'Filter + pan gasket together', query: `${vehicle} transmission filter pan gasket kit`, role: 'required' },
      { name: 'Drain Plug Washer', note: 'Stops pan/drain seepage', query: `${vehicle} transmission drain plug washer`, role: 'required' },
      { name: 'Grey RTV Sealant', note: 'For corners/case points if required', query: `grey rtv gasket maker high temp`, role: 'recommended' },
      { name: 'Fluid Transfer Pump', note: 'Needed for fill-from-below setups', query: `transmission fluid transfer pump`, role: 'recommended' },
    ],
    'spark-plug-type': [
      { name: 'Spark Plug Set', note: `${spec || 'Correct plug type'} for full set`, query: `${vehicle} ${spec} spark plugs set`, role: 'required' },
      { name: 'Spark Plug Socket', note: 'Protects insulator during install', query: `spark plug socket 5/8 magnetic`, role: 'required' },
      { name: 'Torque Wrench (3/8")', note: 'Avoid overtightening aluminum heads', query: `3/8 torque wrench automotive`, role: 'recommended' },
      { name: 'Dielectric Grease', note: 'Boot sealing and moisture resistance', query: `dielectric grease packet`, role: 'recommended' },
    ],
    'tire-size': [
      { name: 'Tires', note: `${spec || 'OEM size'} with correct load/speed rating`, query: `${vehicle} tires ${spec}`, role: 'required' },
      { name: 'Valve Stem / TPMS Service Kit', note: 'Refresh wear parts when mounting tires', query: `tpms valve stem service kit`, role: 'recommended' },
      { name: 'Digital Tire Gauge', note: 'Accurate pressure checks', query: `digital tire pressure gauge`, role: 'recommended' },
      { name: '12V Inflator', note: 'Set pressure at home', query: `12v tire inflator`, role: 'recommended' },
    ],
    'battery-location': [
      { name: 'Replacement Battery', note: `${spec || 'Correct group size'} and chemistry`, query: `${vehicle} ${spec} car battery`, role: 'required' },
      { name: 'Terminal Cleaner Tool', note: 'Fixes hidden corrosion drops', query: `battery terminal cleaner brush`, role: 'required' },
      { name: 'Memory Saver', note: 'Keeps ECU/radio settings during swap', query: `obd2 memory saver`, role: 'recommended' },
      { name: 'Terminal Protection Spray', note: 'Slows corrosion return', query: `battery terminal protector spray`, role: 'recommended' },
    ],
    'serpentine-belt': [
      { name: 'Serpentine Belt', note: 'Exact rib/length for engine setup', query: `${vehicle} serpentine belt`, role: 'required' },
      { name: 'Belt Tensioner', note: 'Replace with belt for longevity', query: `${vehicle} belt tensioner`, role: 'required' },
      { name: 'Idler Pulley', note: 'Swap if noisy/wobbly', query: `${vehicle} idler pulley`, role: 'recommended' },
      { name: 'Breaker Bar (1/2")', note: 'For tensioner release leverage', query: `breaker bar 1/2 inch`, role: 'recommended' },
    ],
    'headlight-bulb': [
      { name: 'Headlight Bulbs', note: `${spec || 'Correct bulb spec'} low/high beam`, query: `${vehicle} headlight bulb ${spec}`, role: 'required' },
      { name: 'Nitrile Gloves', note: 'Avoid oil transfer to bulb glass', query: `nitrile gloves`, role: 'required' },
      { name: 'Dielectric Grease', note: 'Connector moisture protection', query: `dielectric grease`, role: 'recommended' },
    ],
    'wiper-blade-size': [
      { name: 'Wiper Blade Set', note: `${spec || 'Driver/passenger lengths'} matched`, query: `${vehicle} wiper blades ${spec}`, role: 'required' },
      { name: 'Glass Treatment', note: 'Improves wipe performance', query: `rain x glass treatment`, role: 'recommended' },
      { name: 'Washer Fluid Concentrate', note: 'Convenient refill option', query: `windshield washer fluid concentrate`, role: 'recommended' },
    ],
    'brake-fluid-type': [
      { name: 'Brake Fluid', note: `${spec || 'DOT spec'} and enough bottles`, query: `${vehicle} ${spec} brake fluid`, role: 'required' },
      { name: 'Bleeder Bottle Kit', note: 'One-person bleeding setup', query: `one man brake bleeder bottle`, role: 'required' },
      { name: 'Line Wrench Set', note: 'Protects flare nuts from rounding', query: `line wrench set metric`, role: 'recommended' },
      { name: 'Shop Towels', note: 'Immediate cleanup for paint safety', query: `shop towels automotive`, role: 'recommended' },
    ],
    'fluid-capacity': [
      { name: 'Engine Oil', note: 'Match viscosity and volume', query: `${vehicle} motor oil`, role: 'required' },
      { name: 'Coolant', note: 'Match OEM chemistry', query: `${vehicle} coolant antifreeze`, role: 'required' },
      { name: 'Transmission Fluid', note: 'Exact spec only', query: `${vehicle} transmission fluid`, role: 'required' },
      { name: 'Long-Neck Funnel', note: 'Helps with recessed fill points', query: `long neck funnel automotive`, role: 'recommended' },
      { name: 'Fluid Pump', note: 'Cleaner fill/extract workflows', query: `fluid transfer pump automotive`, role: 'recommended' },
    ],
  };
  return templates[toolType] ?? [];
}

function toStorefrontKit(row: BingRow, bingFileName: string): StorefrontKit | null {
  const slug = row.page.replace('/tools/', '').replace(/^\/+|\/+$/g, '');
  const page = getToolPage(slug);
  if (!page) return null;

  const specHint = extractSpecHint(page);
  const vehicle = `${page.make} ${page.model}`;
  const yearBand = page.generations[0]?.years || 'all years';
  const listName = `${vehicle} ${page.toolType.replace(/-/g, ' ')} kit (${yearBand})`;
  const listDescription = `Bing winner for ${vehicle}. Built from OEM spec context on ${BASE_URL}${row.page}. Includes required and recommended items for one-trip service.`;
  const subtagBase = `storefront-${slug}`;

  const items = kitTemplate(page.toolType, page.make, page.model, specHint).map((item, idx) => ({
    ...item,
    affiliateUrl: buildAmazonSearchUrl(item.query, 'automotive', `${subtagBase}-${idx + 1}`),
  }));

  return {
    slug,
    listName,
    listDescription,
    landingPage: `${BASE_URL}${row.page}`,
    source: {
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      bingPageFile: bingFileName,
    },
    items,
  };
}

function toMarkdown(kits: StorefrontKit[], bingFileName: string): string {
  const lines: string[] = [];
  lines.push('# Storefront Kit Builder (Bing-Only)');
  lines.push('');
  lines.push(`Source file: \`${bingFileName}\``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Use each block to create an Amazon Storefront Idea List.');
  lines.push('');

  kits.forEach((kit, i) => {
    lines.push(`## ${i + 1}. ${kit.listName}`);
    lines.push(`- Landing page: ${kit.landingPage}`);
    lines.push(`- Bing performance: ${kit.source.clicks} clicks / ${kit.source.impressions} impressions (${kit.source.ctr} CTR)`);
    lines.push(`- List description: ${kit.listDescription}`);
    lines.push('');
    lines.push('Items:');
    kit.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.name} [${item.role}]`);
      lines.push(`   Query: ${item.query}`);
      lines.push(`   Note: ${item.note}`);
      lines.push(`   Affiliate URL: ${item.affiliateUrl}`);
    });
    lines.push('');
  });

  return lines.join('\n');
}

function main() {
  const topLimitRaw = process.argv.find((arg) => arg.startsWith('--top='))?.split('=')[1];
  const topLimit = Math.max(1, Number(topLimitRaw || 30));
  const latestFile = getLatestBingPagesFile();
  const bingFileName = path.basename(latestFile);
  const rows = parseBingPagesCsv(latestFile)
    .filter((r) => r.clicks > 0)
    .sort((a, b) => (b.clicks - a.clicks) || (b.impressions - a.impressions));

  const seen = new Set<string>();
  const kits: StorefrontKit[] = [];
  for (const row of rows) {
    const slug = row.page.replace('/tools/', '').replace(/^\/+|\/+$/g, '');
    if (seen.has(slug)) continue;
    const kit = toStorefrontKit(row, bingFileName);
    if (!kit || kit.items.length === 0) continue;
    kits.push(kit);
    seen.add(slug);
    if (kits.length >= topLimit) break;
  }

  const dateTag = new Date().toISOString().slice(0, 10);
  const suffix = topLimit === 30 ? '' : `-top${topLimit}`;
  const jsonOut = path.join(SEO_REPORTS_DIR, `storefront-kit-builder-${dateTag}${suffix}.json`);
  const mdOut = path.join(SEO_REPORTS_DIR, `storefront-kit-builder-${dateTag}${suffix}.md`);
  const jsonLatest = path.join(SEO_REPORTS_DIR, `storefront-kit-builder-latest${suffix}.json`);
  const mdLatest = path.join(SEO_REPORTS_DIR, `storefront-kit-builder-latest${suffix}.md`);

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceFile: bingFileName,
    totalRowsParsed: rows.length,
    kitsGenerated: kits.length,
    requestedTopLimit: topLimit,
    kits,
  };

  fs.writeFileSync(jsonOut, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdOut, `${toMarkdown(kits, bingFileName)}\n`, 'utf8');
  fs.writeFileSync(jsonLatest, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdLatest, `${toMarkdown(kits, bingFileName)}\n`, 'utf8');

  console.log(`Generated ${kits.length} Bing-driven storefront kit drafts`);
  console.log(`- ${jsonOut}`);
  console.log(`- ${mdOut}`);
  console.log(`- ${jsonLatest}`);
  console.log(`- ${mdLatest}`);
}

main();
