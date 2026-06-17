import { NextRequest, NextResponse } from 'next/server';
import {
  isValidVehicleCombination,
  getClampedYear,
  getDisplayName,
  slugifyRoutePart,
  isCorpusBacked,
} from '@/data/vehicles';
import { getVehicleRepairSpec } from '@/data/vehicle-repair-specs';
import { getGeneratedRepairProfile } from '@/lib/vehicleRepairProfiles';
import { getOEMExcerptsForRepair } from '@/lib/manualSectionLinks';
import { buildRepairKnowledgeGraph } from '@/lib/repairKnowledgeGraph';
import { buildRepairUrl } from '@/lib/vehicleIdentity';
import { checkStripeAccess, attachCreditHeader, buildStripeRequiredResponse } from '@/lib/paymentGate';

const TASK_META: Record<string, { title: string; description: string }> = {
  'oil-change': { title: 'Oil Change', description: 'Oil change guide for {v}.' },
  'brake-pad-replacement': { title: 'Brake Pad Replacement', description: 'Brake pad replacement for {v}.' },
  'brake-rotor-replacement': { title: 'Brake Rotor Replacement', description: 'Brake rotor replacement for {v}.' },
  'alternator-replacement': { title: 'Alternator Replacement', description: 'Alternator replacement for {v}.' },
  'starter-replacement': { title: 'Starter Replacement', description: 'Starter replacement for {v}.' },
  'battery-replacement': { title: 'Battery Replacement', description: 'Battery replacement for {v}.' },
  'spark-plug-replacement': { title: 'Spark Plug Replacement', description: 'Spark plug replacement for {v}.' },
  'radiator-replacement': { title: 'Radiator Replacement', description: 'Radiator replacement for {v}.' },
  'thermostat-replacement': { title: 'Thermostat Replacement', description: 'Thermostat replacement for {v}.' },
  'water-pump-replacement': { title: 'Water Pump Replacement', description: 'Water pump replacement for {v}.' },
  'serpentine-belt-replacement': { title: 'Serpentine Belt Replacement', description: 'Serpentine belt replacement for {v}.' },
  'cabin-air-filter-replacement': { title: 'Cabin Air Filter Replacement', description: 'Cabin air filter replacement for {v}.' },
  'engine-air-filter-replacement': { title: 'Engine Air Filter Replacement', description: 'Engine air filter replacement for {v}.' },
  'wiper-blade-replacement': { title: 'Wiper Blade Replacement', description: 'Wiper blade replacement for {v}.' },
  'headlight-bulb-replacement': { title: 'Headlight Bulb Replacement', description: 'Headlight bulb replacement for {v}.' },
  'taillight-bulb-replacement': { title: 'Taillight Bulb Replacement', description: 'Taillight bulb replacement for {v}.' },
  'transmission-fluid-change': { title: 'Transmission Fluid Change', description: 'Transmission fluid change for {v}.' },
  'differential-fluid-change': { title: 'Differential Fluid Change', description: 'Differential fluid change for {v}.' },
  'transfer-case-fluid-change': { title: 'Transfer Case Fluid Change', description: 'Transfer case fluid change for {v}.' },
  'coolant-flush': { title: 'Coolant Flush', description: 'Coolant flush for {v}.' },
  'fuel-filter-replacement': { title: 'Fuel Filter Replacement', description: 'Fuel filter replacement for {v}.' },
  'oxygen-sensor-replacement': { title: 'Oxygen Sensor Replacement', description: 'O2 sensor replacement for {v}.' },
  'wheel-bearing-replacement': { title: 'Wheel Bearing Replacement', description: 'Wheel bearing replacement for {v}.' },
  'strut-replacement': { title: 'Strut Replacement', description: 'Strut replacement for {v}.' },
  'shock-absorber-replacement': { title: 'Shock Absorber Replacement', description: 'Shock absorber replacement for {v}.' },
  'control-arm-replacement': { title: 'Control Arm Replacement', description: 'Control arm replacement for {v}.' },
  'tie-rod-end-replacement': { title: 'Tie Rod End Replacement', description: 'Tie rod end replacement for {v}.' },
  'cv-axle-replacement': { title: 'CV Axle Replacement', description: 'CV axle replacement for {v}.' },
  'brake-caliper-replacement': { title: 'Brake Caliper Replacement', description: 'Brake caliper replacement for {v}.' },
  'brake-master-cylinder-replacement': { title: 'Brake Master Cylinder Replacement', description: 'Master cylinder replacement for {v}.' },
  'power-steering-pump-replacement': { title: 'Power Steering Pump Replacement', description: 'Power steering pump replacement for {v}.' },
  'rack-and-pinion-replacement': { title: 'Rack and Pinion Replacement', description: 'Rack and pinion replacement for {v}.' },
  'fuel-pump-replacement': { title: 'Fuel Pump Replacement', description: 'Fuel pump replacement for {v}.' },
  'ignition-coil-replacement': { title: 'Ignition Coil Replacement', description: 'Ignition coil replacement for {v}.' },
  'mass-airflow-sensor-replacement': { title: 'MAF Sensor Replacement', description: 'MAF sensor replacement for {v}.' },
  'throttle-body-cleaning': { title: 'Throttle Body Cleaning', description: 'Throttle body cleaning for {v}.' },
  'valve-cover-gasket-replacement': { title: 'Valve Cover Gasket Replacement', description: 'Valve cover gasket replacement for {v}.' },
  'timing-belt-replacement': { title: 'Timing Belt Replacement', description: 'Timing belt replacement for {v}.' },
  'timing-chain-replacement': { title: 'Timing Chain Replacement', description: 'Timing chain replacement for {v}.' },
};

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function HEAD(request: NextRequest) {
  const pagePath = request.nextUrl.pathname + request.nextUrl.search;
  const access = await checkStripeAccess(request, pagePath);
  if (!access.allowed) {
    return access.response ?? buildStripeRequiredResponse(request, pagePath, 'missing_payment');
  }
  return new NextResponse(null, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '';
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const task = searchParams.get('task') || '';

  if (!year || !make || !model || !task) {
    return NextResponse.json(
      { error: 'Missing required parameters: year, make, model, task' },
      { status: 400 }
    );
  }

  const canonicalMake = slugifyRoutePart(make);
  const canonicalModel = slugifyRoutePart(model);
  const canonicalTask = slugifyRoutePart(task);
  const clampedYear = getClampedYear(year, canonicalMake, canonicalModel);
  const resolvedYear = String(clampedYear ?? year);

  if (!isValidVehicleCombination(resolvedYear, canonicalMake, canonicalModel, canonicalTask)) {
    return NextResponse.json({ error: 'Invalid vehicle or task combination' }, { status: 404 });
  }

  // Stripe credits gate (x402 is handled in middleware before this route runs)
  const pagePath = request.nextUrl.pathname + request.nextUrl.search;
  const access = await checkStripeAccess(request, pagePath);
  if (!access.allowed) {
    return access.response!;
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
    steps: ['Prepare vehicle and workspace', `Follow factory procedure for ${cleanTask}`, 'Torque all fasteners to spec', 'Verify repair before driving'],
  };

  const repairData = {
    difficulty: vehicleSpec?.difficulty || genericData.difficulty,
    time: vehicleSpec?.time || genericData.time,
    tools: vehicleSpec?.tools || genericData.tools,
    parts: vehicleSpec
      ? vehicleSpec.parts.map(p => ({
          name: p.name,
          spec: p.spec || undefined,
          oem: p.oem || undefined,
          aftermarket: p.aftermarket || undefined,
        }))
      : genericData.parts.map(name => ({ name })),
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
        limit: 10,
      });
      oemExcerpts = excerpts.map((e: any) => ({
        title: e.title || 'OEM Reference',
        content: e.content || e.text || '',
        source: e.source || 'Factory Service Manual',
      }));
    } catch {
      // OEM excerpts optional
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
    // Knowledge graph optional
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
    tier: 'premium',
    payment: {
      protocol: 'x402',
      scheme: 'exact',
      price: '$0.01',
      asset: 'USDC',
      network: 'solana',
      options: [
        {
          protocol: 'x402',
          scheme: 'exact',
          price: '$0.01',
          asset: 'USDC',
          network: 'solana-devnet',
        },
        {
          protocol: 'stripe',
          model: 'credits',
          price: '$0.01',
          per: 'page',
          checkout_url: 'https://alloemmanuals.com/api/stripe/checkout',
          account_url: 'https://alloemmanuals.com/api/account',
        },
      ],
    },
  };

  const res = NextResponse.json(response);
  res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
  res.headers.set('Vary', 'Accept-Encoding, Authorization');
  return attachCreditHeader(res, access.remaining);
}
