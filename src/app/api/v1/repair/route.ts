import { NextRequest, NextResponse } from 'next/server';
import {
  isValidVehicleCombination,
  getClampedYear,
  getDisplayName,
  slugifyRoutePart,
  CORPUS_YEAR_MAX,
  isCorpusBacked,
} from '@/data/vehicles';
import { getVehicleRepairSpec } from '@/data/vehicle-repair-specs';
import { getGeneratedRepairProfile } from '@/lib/vehicleRepairProfiles';
import { getOEMExcerptsForRepair } from '@/lib/manualSectionLinks';
import { buildRepairKnowledgeGraph } from '@/lib/repairKnowledgeGraph';
import { buildRepairUrl } from '@/lib/vehicleIdentity';
import { checkStripeAccess, attachCreditHeader, buildStripeRequiredResponse } from '@/lib/paymentGate';

// Inlined from page.tsx so API route can serve the same data without importing a page component
const TASK_META: Record<string, { title: string; description: string; extraKeywords: string[] }> = {
  'oil-change': {
    title: 'Oil Change',
    description: 'Step-by-step oil change guide for {v}. Tools, parts, torque specs, and capacity.',
    extraKeywords: ['engine oil capacity', 'oil filter location', 'oil drain plug torque'],
  },
  'brake-pad-replacement': {
    title: 'Brake Pad Replacement',
    description: 'Brake pad replacement guide for {v}. Torque specs, tools, and bedding procedure.',
    extraKeywords: ['brake pad torque spec', 'caliper bolt torque', 'brake grease'],
  },
  'brake-rotor-replacement': {
    title: 'Brake Rotor Replacement',
    description: 'Brake rotor replacement guide for {v}. Runout specs, cleaning, and torque.',
    extraKeywords: ['rotor runout spec', 'brake rotor torque', 'hub cleaning'],
  },
  'alternator-replacement': {
    title: 'Alternator Replacement',
    description: 'Alternator replacement guide for {v}. Belt routing, electrical connectors, and torque.',
    extraKeywords: ['alternator torque spec', 'serpentine belt routing', 'battery disconnect'],
  },
  'starter-replacement': {
    title: 'Starter Replacement',
    description: 'Starter replacement guide for {v}. Mounting bolts, electrical connections, and torque.',
    extraKeywords: ['starter bolt torque', 'starter wiring', 'neutral safety switch'],
  },
  'battery-replacement': {
    title: 'Battery Replacement',
    description: 'Battery replacement guide for {v}. Group size, terminal torque, and memory saver.',
    extraKeywords: ['battery group size', 'battery terminal torque', 'battery location'],
  },
  'spark-plug-replacement': {
    title: 'Spark Plug Replacement',
    description: 'Spark plug replacement guide for {v}. Gap spec, torque, coil removal, and anti-seize.',
    extraKeywords: ['spark plug gap', 'spark plug torque', 'ignition coil removal'],
  },
  'radiator-replacement': {
    title: 'Radiator Replacement',
    description: 'Radiator replacement guide for {v}. Coolant capacity, hose clamps, and bleeding.',
    extraKeywords: ['coolant capacity', 'radiator hose clamp', 'coolant bleeding'],
  },
  'thermostat-replacement': {
    title: 'Thermostat Replacement',
    description: 'Thermostat replacement guide for {v}. Housing torque, gasket, and coolant refill.',
    extraKeywords: ['thermostat housing torque', 'coolant refill', 'thermostat gasket'],
  },
  'water-pump-replacement': {
    title: 'Water Pump Replacement',
    description: 'Water pump replacement guide for {v}. Pulley removal, gasket/sealant, and torque.',
    extraKeywords: ['water pump torque', 'water pump gasket', 'coolant pump sealant'],
  },
  'serpentine-belt-replacement': {
    title: 'Serpentine Belt Replacement',
    description: 'Serpentine belt replacement guide for {v}. Routing diagram, tensioner, and length.',
    extraKeywords: ['serpentine belt routing', 'belt tensioner', 'drive belt length'],
  },
  'cabin-air-filter-replacement': {
    title: 'Cabin Air Filter Replacement',
    description: 'Cabin air filter replacement guide for {v}. Location, direction arrow, and interval.',
    extraKeywords: ['cabin filter location', 'cabin filter direction', 'cabin air filter size'],
  },
  'engine-air-filter-replacement': {
    title: 'Engine Air Filter Replacement',
    description: 'Engine air filter replacement guide for {v}. Housing clips, direction, and interval.',
    extraKeywords: ['air filter location', 'engine air filter size', 'air filter housing clips'],
  },
  'wiper-blade-replacement': {
    title: 'Wiper Blade Replacement',
    description: 'Wiper blade replacement guide for {v}. Sizes, adapter type, and arm lock.',
    extraKeywords: ['wiper blade size', 'wiper blade adapter', 'wiper arm removal'],
  },
  'headlight-bulb-replacement': {
    title: 'Headlight Bulb Replacement',
    description: 'Headlight bulb replacement guide for {v}. Bulb type, access, and alignment.',
    extraKeywords: ['headlight bulb type', 'headlight bulb access', 'headlight alignment'],
  },
  'taillight-bulb-replacement': {
    title: 'Taillight Bulb Replacement',
    description: 'Taillight bulb replacement guide for {v}. Bulb type, trunk access, and socket.',
    extraKeywords: ['taillight bulb type', 'brake light bulb', 'tail light socket'],
  },
  'transmission-fluid-change': {
    title: 'Transmission Fluid Change',
    description: 'Transmission fluid change guide for {v}. ATF type, capacity, drain/fill plugs, and level check.',
    extraKeywords: ['transmission fluid capacity', 'ATF type', 'transmission drain plug torque'],
  },
  'differential-fluid-change': {
    title: 'Differential Fluid Change',
    description: 'Differential fluid change guide for {v}. Fluid type, capacity, fill plug torque, and level.',
    extraKeywords: ['differential fluid type', 'differential fluid capacity', 'diff drain plug torque'],
  },
  'transfer-case-fluid-change': {
    title: 'Transfer Case Fluid Change',
    description: 'Transfer case fluid change guide for {v}. Fluid type, capacity, and fill procedure.',
    extraKeywords: ['transfer case fluid', 'transfer case capacity', 'transfer case drain plug'],
  },
  'coolant-flush': {
    title: 'Coolant Flush',
    description: 'Coolant flush guide for {v}. Coolant type, capacity, bleeding, and interval.',
    extraKeywords: ['coolant type', 'coolant capacity', 'coolant bleeding procedure'],
  },
  'fuel-filter-replacement': {
    title: 'Fuel Filter Replacement',
    description: 'Fuel filter replacement guide for {v}. Location, line torque, and depressurization.',
    extraKeywords: ['fuel filter location', 'fuel line torque', 'fuel system depressurization'],
  },
  'oxygen-sensor-replacement': {
    title: 'Oxygen Sensor Replacement',
    description: 'O2 sensor replacement guide for {v}. Bank/sensor location, socket, and torque.',
    extraKeywords: ['O2 sensor location', 'oxygen sensor socket', 'O2 sensor torque'],
  },
  'wheel-bearing-replacement': {
    title: 'Wheel Bearing Replacement',
    description: 'Wheel bearing replacement guide for {v}. Hub torque, press fit, and ABS ring.',
    extraKeywords: ['wheel bearing torque', 'hub assembly torque', 'wheel bearing press'],
  },
  'strut-replacement': {
    title: 'Strut Replacement',
    description: 'Strut replacement guide for {v}. Spring compressor, top nut torque, and alignment.',
    extraKeywords: ['strut torque spec', 'spring compressor', 'strut top nut torque'],
  },
  'shock-absorber-replacement': {
    title: 'Shock Absorber Replacement',
    description: 'Shock absorber replacement guide for {v}. Upper/lower bolt torque and access.',
    extraKeywords: ['shock bolt torque', 'shock absorber replacement', 'rear shock access'],
  },
  'control-arm-replacement': {
    title: 'Control Arm Replacement',
    description: 'Control arm replacement guide for {v}. Bushing orientation, bolt torque, and alignment.',
    extraKeywords: ['control arm torque', 'control arm bushing', 'lower control arm bolt'],
  },
  'tie-rod-end-replacement': {
    title: 'Tie Rod End Replacement',
    description: 'Tie rod end replacement guide for {v}. Count threads, torque, and alignment.',
    extraKeywords: ['tie rod torque', 'tie rod end replacement', 'steering alignment'],
  },
  'cv-axle-replacement': {
    title: 'CV Axle Replacement',
    description: 'CV axle replacement guide for {v}. Axle nut torque, snap ring, and seal.',
    extraKeywords: ['axle nut torque', 'CV axle seal', 'axle snap ring'],
  },
  'brake-caliper-replacement': {
    title: 'Brake Caliper Replacement',
    description: 'Brake caliper replacement guide for {v}. Banjo bolt torque, bleeding, and slide pins.',
    extraKeywords: ['caliper banjo bolt torque', 'brake caliper bleeding', 'caliper slide pins'],
  },
  'brake-master-cylinder-replacement': {
    title: 'Brake Master Cylinder Replacement',
    description: 'Brake master cylinder replacement guide for {v}. Pushrod, bench bleed, and line torque.',
    extraKeywords: ['master cylinder torque', 'brake line torque', 'bench bleed master cylinder'],
  },
  'power-steering-pump-replacement': {
    title: 'Power Steering Pump Replacement',
    description: 'Power steering pump replacement guide for {v}. Pulley, line torque, and fluid type.',
    extraKeywords: ['power steering pump torque', 'power steering line torque', 'power steering fluid type'],
  },
  'rack-and-pinion-replacement': {
    title: 'Rack and Pinion Replacement',
    description: 'Rack and pinion replacement guide for {v}. Tie rod transfer, torque, and alignment.',
    extraKeywords: ['rack and pinion torque', 'steering rack replacement', 'power steering line'],
  },
  'fuel-pump-replacement': {
    title: 'Fuel Pump Replacement',
    description: 'Fuel pump replacement guide for {v}. Access panel/tank drop, lock ring, and seal.',
    extraKeywords: ['fuel pump access', 'fuel pump lock ring', 'fuel tank drop'],
  },
  'ignition-coil-replacement': {
    title: 'Ignition Coil Replacement',
    description: 'Ignition coil replacement guide for {v}. Coil bolt torque, connector, and misfire codes.',
    extraKeywords: ['ignition coil torque', 'coil connector', 'ignition coil misfire'],
  },
  'mass-airflow-sensor-replacement': {
    title: 'MAF Sensor Replacement',
    description: 'MAF sensor replacement guide for {v}. Sensor cleaner vs replacement, torque, and reset.',
    extraKeywords: ['MAF sensor torque', 'mass airflow sensor cleaner', 'MAF sensor reset'],
  },
  'throttle-body-cleaning': {
    title: 'Throttle Body Cleaning',
    description: 'Throttle body cleaning guide for {v}. Cleaner type, gasket, and relearn procedure.',
    extraKeywords: ['throttle body cleaner', 'throttle body gasket', 'throttle relearn procedure'],
  },
  'valve-cover-gasket-replacement': {
    title: 'Valve Cover Gasket Replacement',
    description: 'Valve cover gasket replacement guide for {v}. RTV, torque sequence, and spark tube seals.',
    extraKeywords: ['valve cover torque sequence', 'valve cover RTV', 'spark tube seal'],
  },
  'timing-belt-replacement': {
    title: 'Timing Belt Replacement',
    description: 'Timing belt replacement guide for {v}. Timing marks, tensioner, idler, and interval.',
    extraKeywords: ['timing belt marks', 'timing belt tensioner', 'timing belt interval'],
  },
  'timing-chain-replacement': {
    title: 'Timing Chain Replacement',
    description: 'Timing chain replacement guide for {v}. Chain guides, tensioner, and timing procedure.',
    extraKeywords: ['timing chain guides', 'timing chain tensioner', 'timing chain replacement'],
  },
};

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const pagePath = pathname;

  // Payment gate: x402 verified in middleware, Stripe credits validated here.
  const access = await checkStripeAccess(request, pagePath);
  if (!access.allowed) {
    return access.response ?? buildStripeRequiredResponse(request, pagePath, 'missing_payment');
  }

  const year = searchParams.get('year') || '';
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const task = searchParams.get('task') || '';

  if (!year || !make || !model || !task) {
    return NextResponse.json({ error: 'Missing required parameters: year, make, model, task' }, { status: 400 });
  }

  const canonicalMake = slugifyRoutePart(make);
  const canonicalModel = slugifyRoutePart(model);
  const canonicalTask = slugifyRoutePart(task);
  const clampedYear = getClampedYear(year, canonicalMake, canonicalModel);
  const resolvedYear = String(clampedYear ?? year);

  if (!isValidVehicleCombination(resolvedYear, canonicalMake, canonicalModel, canonicalTask)) {
    return NextResponse.json({ error: 'Invalid vehicle or task combination' }, { status: 404 });
  }

  const cleanTask = canonicalTask.replace(/-/g, ' ');
  const displayMake = getDisplayName(canonicalMake, 'make') || toTitleCase(canonicalMake);
  const displayModel = getDisplayName(canonicalModel, 'model') || toTitleCase(canonicalModel);
  const vehicleName = `${resolvedYear} ${displayMake} ${displayModel}`;
  const canonicalPath = buildRepairUrl(resolvedYear, canonicalMake, canonicalModel, canonicalTask);

  const vehicleSpec = getVehicleRepairSpec(resolvedYear, canonicalMake, canonicalModel, canonicalTask);
  const exactGuideProfile = await getGeneratedRepairProfile(resolvedYear, canonicalMake, canonicalModel, canonicalTask);
  const taskMeta = TASK_META[canonicalTask];

  const genericData = {
    difficulty: 'Intermediate',
    time: '1-2 hours',
    tools: ['Socket wrench set', 'Torque wrench'],
    parts: [`${cleanTask} parts (vehicle specific)`],
    warnings: ['Consult factory service manual for exact torque specs', 'Work on a cool engine when possible'],
    steps: [`Prepare vehicle and workspace`, `Follow factory procedure for ${cleanTask}`, `Torque all fasteners to spec`, `Verify repair before driving`],
  };

  const repairData = {
    difficulty: vehicleSpec?.difficulty || genericData.difficulty,
    time: vehicleSpec?.time || genericData.time,
    tools: vehicleSpec?.tools || genericData.tools,
    parts: vehicleSpec
      ? vehicleSpec.parts.map(p => p.name + (p.spec ? ` (${p.spec})` : '') + (p.oem ? ` [OEM: ${p.oem}]` : '') + (p.aftermarket ? ` [Aftermarket: ${p.aftermarket}]` : ''))
      : genericData.parts,
    warnings: vehicleSpec?.warnings || genericData.warnings,
    steps: vehicleSpec?.steps || genericData.steps,
    torqueSpecs: vehicleSpec?.torqueSpecs || undefined,
    beltRouting: vehicleSpec?.beltRouting || undefined,
    vehicleNotes: vehicleSpec?.vehicleNotes || undefined,
  };

  let oemExcerpts: { title: string; content: string; source: string }[] = [];
  if (isCorpusBacked(Number(resolvedYear))) {
    try {
      const excerpts = await getOEMExcerptsForRepair({
        make: canonicalMake,
        year: Number(resolvedYear),
        model: canonicalModel,
        task: canonicalTask,
        displayMake,
        displayModel,
        limit: 5,
      });
      oemExcerpts = excerpts.map((e: any) => ({
        title: e.title || 'OEM Reference',
        content: e.content || e.text || '',
        source: e.source || 'Factory Service Manual',
      }));
    } catch {
      // OEM excerpts are optional — don't fail the whole response
    }
  }

  let knowledgeGraphData: any = null;
  try {
    const kg = await buildRepairKnowledgeGraph({
      year: resolvedYear,
      make: canonicalMake,
      displayMake,
      model: canonicalModel,
      displayModel,
      task: canonicalTask,
      repairTools: repairData.tools,
      vehicleSpec: vehicleSpec ?? undefined,
    });
    knowledgeGraphData = {
      groups: kg.groups.map((g: any) => ({
        kind: g.kind,
        title: g.title,
        nodes: g.nodes.map((n: any) => ({
          label: n.label,
          description: n.description,
          href: n.href,
          badge: n.badge,
        })),
      })),
    };
  } catch {
    // Knowledge graph is optional
  }

  const response = {
    vehicle: {
      year: resolvedYear,
      make: displayMake,
      model: displayModel,
      name: vehicleName,
    },
    task: {
      slug: canonicalTask,
      title: taskMeta?.title || toTitleCase(cleanTask),
      description: taskMeta?.description.replace('{v}', vehicleName) || `${cleanTask} for ${vehicleName}`,
    },
    url: `https://alloemmanuals.com${canonicalPath}`,
    guide: {
      difficulty: repairData.difficulty,
      estimatedTime: repairData.time,
      tools: repairData.tools,
      parts: repairData.parts,
      warnings: repairData.warnings,
      steps: repairData.steps.map((instruction: string, idx: number) => ({
        stepNumber: idx + 1,
        instruction,
      })),
      torqueSpecs: repairData.torqueSpecs,
      beltRouting: repairData.beltRouting,
      vehicleNotes: repairData.vehicleNotes,
    },
    oemExcerpts,
    knowledgeGraph: knowledgeGraphData,
    generated: !!exactGuideProfile,
    corpusBacked: isCorpusBacked(Number(resolvedYear)),
  };

  const res = NextResponse.json(response);
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('Vary', 'Accept-Encoding, User-Agent, Authorization');
  attachCreditHeader(res, access.remaining);
  return res;
}
