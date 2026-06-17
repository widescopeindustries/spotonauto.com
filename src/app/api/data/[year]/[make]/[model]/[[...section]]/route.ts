import { NextRequest, NextResponse } from 'next/server';
import {
  isValidVehicleCombination,
  getClampedYear,
  getDisplayName,
  slugifyRoutePart,
  isCorpusBacked,
} from '@/data/vehicles';
import { canonicalizeVehicleIdentity } from '@/lib/vehicleIdentity';
import { getToolPagesForVehicle, getConciseQuickAnswer } from '@/data/tools-pages';
import { getProfilesForVehicle } from '@/lib/vehicleRepairProfiles';
import { buildVehicleLaneData } from '@/lib/vehicleLane';
import { getVehicleRepairSpec } from '@/data/vehicle-repair-specs';
import { getGeneratedRepairProfile } from '@/lib/vehicleRepairProfiles';
import { getOEMExcerptsForRepair } from '@/lib/manualSectionLinks';
import { buildRepairKnowledgeGraph } from '@/lib/repairKnowledgeGraph';
import { checkStripeAccess, attachCreditHeader, buildStripeRequiredResponse } from '@/lib/paymentGate';

const X402_PAYMENT_INFO = {
  protocol: 'x402',
  scheme: 'exact',
  price: '$0.01',
  asset: 'USDC',
  network: 'solana-devnet',
  per: 'page',
  volume_discounts: {
    '100000': '$0.005',
    '1000000': '$0.001',
  },
};

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>');
}

function stripAffiliateLinks(markdown: string): string {
  // Remove any Amazon affiliate URLs
  return markdown
    .replace(/https?:\/\/www\.amazon\.com\/s\?k=[^\s)]+/g, '[parts search]')
    .replace(/https?:\/\/[^\s)]*tag=[^\s)]*/g, '[link removed]')
    .replace(/\[([^\]]+)\]\([^)]*tag=[^)]*\)/g, '$1');
}

async function buildHubMarkdown(
  year: number,
  makeSlug: string,
  modelSlug: string,
  identity: ReturnType<typeof canonicalizeVehicleIdentity>
): Promise<string> {
  const displayName = `${year} ${identity.displayMake} ${identity.displayModel}`;
  const lines: string[] = [];

  lines.push(`# ${displayName}`);
  lines.push('');
  lines.push(`**Vehicle:** ${displayName}`);
  lines.push(`**Make:** ${identity.displayMake}`);
  lines.push(`**Model:** ${identity.displayModel}`);
  lines.push(`**Year:** ${year}`);
  if (identity.displayVariant) {
    lines.push(`**Variant:** ${identity.displayVariant}`);
  }
  lines.push(`**Corpus:** ${isCorpusBacked(year) ? 'CHARM/LEMON (factory manual backed)' : 'Profile/generated data only'}`);
  lines.push('');

  // Factory Specifications
  const toolPages = getToolPagesForVehicle(makeSlug, modelSlug);
  if (toolPages.length > 0) {
    lines.push('## Factory Specifications');
    lines.push('');
    for (const tp of toolPages) {
      const answer = getConciseQuickAnswer(year, tp);
      if (answer) {
        lines.push(`- **${tp.title}:** ${escapeMarkdown(answer)}`);
      }
    }
    lines.push('');
  }

  // Repair Profiles
  const repairProfiles = await getProfilesForVehicle(year, makeSlug, modelSlug);
  if (repairProfiles.length > 0) {
    lines.push('## Common Repairs');
    lines.push('');
    for (const rp of repairProfiles.slice(0, 20)) {
      const title = rp.profile.supportNote?.title || toTitleCase(rp.task);
      lines.push(`### ${title}`);
      if (rp.profile.supportNote?.intro) {
        lines.push(escapeMarkdown(rp.profile.supportNote.intro));
      }
      if (rp.profile.supportNote?.bullets && rp.profile.supportNote.bullets.length > 0) {
        for (const bullet of rp.profile.supportNote.bullets) {
          lines.push(`- ${escapeMarkdown(bullet)}`);
        }
      }
      if (rp.profile.toolsNeeded && rp.profile.toolsNeeded.length > 0) {
        lines.push(`**Tools:** ${rp.profile.toolsNeeded.map((t) => t.name).join(', ')}`);
      }
      lines.push('');
    }
  }

  // DTC Codes and Systems from corpus
  let laneData: Awaited<ReturnType<typeof buildVehicleLaneData>> = null;
  try {
    laneData = await buildVehicleLaneData(makeSlug, year, modelSlug);
  } catch {
    // Lane data optional
  }

  if (laneData && laneData.dtcCodes.length > 0) {
    lines.push('## Diagnostic Trouble Codes');
    lines.push('');
    for (const dtc of laneData.dtcCodes.slice(0, 30)) {
      lines.push(`- **${dtc.code}** — ${escapeMarkdown(dtc.title)} (${dtc.system})`);
    }
    lines.push('');
  }

  if (laneData && laneData.systems.length > 0) {
    lines.push('## Factory Manual Systems');
    lines.push('');
    for (const sys of laneData.systems.slice(0, 15)) {
      lines.push(`### ${sys.name}`);
      lines.push(`- Content items: ${sys.totalCount}`);
      lines.push(`- DTCs/Diagnostics: ${sys.dtcCount}`);
      lines.push(`- Procedures: ${sys.procedureCount}`);
      lines.push(`- Diagrams: ${sys.diagramCount}`);
      if (sys.entries.length > 0) {
        lines.push('- Entries:');
        for (const entry of sys.entries.slice(0, 10)) {
          lines.push(`  - [${entry.type}] ${escapeMarkdown(entry.title)}`);
        }
      }
      lines.push('');
    }
  }

  // Graph data
  if (laneData?.graph) {
    lines.push('## Related Procedures (Graph)');
    lines.push('');
    for (const proc of laneData.graph.procedures.slice(0, 15)) {
      lines.push(`- **${escapeMarkdown(proc.title)}** (${proc.system})`);
    }
    lines.push('');
  }

  // Footer with attribution
  lines.push('---');
  lines.push('');
  lines.push(`*Source: AllOEMManuals.com — Factory service manual data for ${displayName}*`);
  lines.push(`*Retrieved: ${new Date().toISOString()}*`);
  lines.push(`*License: Paid access via x402. Citation required. No resale.*`);
  lines.push('');

  return stripAffiliateLinks(lines.join('\n'));
}

async function buildRepairMarkdown(
  year: number,
  makeSlug: string,
  modelSlug: string,
  identity: ReturnType<typeof canonicalizeVehicleIdentity>,
  task: string
): Promise<string | null> {
  const canonicalTask = slugifyRoutePart(task);
  const clampedYear = getClampedYear(String(year), makeSlug, modelSlug);
  const resolvedYear = String(clampedYear ?? year);

  if (!isValidVehicleCombination(resolvedYear, makeSlug, modelSlug, canonicalTask)) {
    return null;
  }

  const displayName = `${resolvedYear} ${identity.displayMake} ${identity.displayModel}`;
  const cleanTask = canonicalTask.replace(/-/g, ' ');
  const taskTitle = toTitleCase(cleanTask);

  const lines: string[] = [];
  lines.push(`# ${taskTitle} — ${displayName}`);
  lines.push('');

  const vehicleSpec = getVehicleRepairSpec(resolvedYear, makeSlug, modelSlug, canonicalTask);
  const exactGuideProfile = await getGeneratedRepairProfile(resolvedYear, makeSlug, modelSlug, canonicalTask);

  if (vehicleSpec) {
    lines.push(`**Difficulty:** ${vehicleSpec.difficulty || 'Intermediate'}`);
    lines.push(`**Estimated Time:** ${vehicleSpec.time || '1-2 hours'}`);
    lines.push('');

    if (vehicleSpec.tools && vehicleSpec.tools.length > 0) {
      lines.push('## Tools Required');
      lines.push('');
      for (const tool of vehicleSpec.tools) {
        lines.push(`- ${escapeMarkdown(tool)}`);
      }
      lines.push('');
    }

    if (vehicleSpec.parts && vehicleSpec.parts.length > 0) {
      lines.push('## Parts');
      lines.push('');
      for (const part of vehicleSpec.parts) {
        let line = `- **${escapeMarkdown(part.name)}**`;
        if (part.spec) line += ` — Spec: ${escapeMarkdown(part.spec)}`;
        if (part.oem) line += ` — OEM: ${escapeMarkdown(part.oem)}`;
        if (part.aftermarket) line += ` — Aftermarket: ${escapeMarkdown(part.aftermarket)}`;
        lines.push(line);
      }
      lines.push('');
    }

    if (vehicleSpec.warnings && vehicleSpec.warnings.length > 0) {
      lines.push('## Warnings');
      lines.push('');
      for (const warning of vehicleSpec.warnings) {
        lines.push(`> ⚠️ ${escapeMarkdown(warning)}`);
      }
      lines.push('');
    }

    if (vehicleSpec.steps && vehicleSpec.steps.length > 0) {
      lines.push('## Procedure');
      lines.push('');
      for (let i = 0; i < vehicleSpec.steps.length; i++) {
        lines.push(`${i + 1}. ${escapeMarkdown(vehicleSpec.steps[i])}`);
      }
      lines.push('');
    }

    if (vehicleSpec.torqueSpecs) {
      lines.push('## Torque Specifications');
      lines.push('');
      lines.push(escapeMarkdown(vehicleSpec.torqueSpecs));
      lines.push('');
    }

    if (vehicleSpec.beltRouting) {
      lines.push('## Belt Routing');
      lines.push('');
      lines.push(escapeMarkdown(vehicleSpec.beltRouting));
      lines.push('');
    }

    if (vehicleSpec.vehicleNotes && vehicleSpec.vehicleNotes.length > 0) {
      lines.push('## Vehicle-Specific Notes');
      lines.push('');
      for (const note of vehicleSpec.vehicleNotes) {
        lines.push(`- ${escapeMarkdown(note)}`);
      }
      lines.push('');
    }
  }

  // OEM Excerpts
  if (isCorpusBacked(Number(resolvedYear))) {
    try {
      const excerpts = await getOEMExcerptsForRepair({
        make: makeSlug,
        year: Number(resolvedYear),
        model: modelSlug,
        task: canonicalTask,
        displayMake: identity.displayMake,
        displayModel: identity.displayModel,
        limit: 10,
      });
      if (excerpts.length > 0) {
        lines.push('## Factory Manual Excerpts');
        lines.push('');
        for (const excerpt of excerpts) {
          lines.push(`### ${escapeMarkdown(excerpt.sectionTitle || 'OEM Reference')}`);
          lines.push(escapeMarkdown(excerpt.contentPreview || ''));
          lines.push(`*Source: Factory Service Manual — ${escapeMarkdown(excerpt.manualHref || excerpt.path)}*`);
          lines.push('');
        }
      }
    } catch {
      // OEM excerpts optional
    }
  }

  // Knowledge Graph
  try {
    const kg = await buildRepairKnowledgeGraph({
      year: resolvedYear,
      make: makeSlug,
      displayMake: identity.displayMake,
      model: modelSlug,
      displayModel: identity.displayModel,
      task: canonicalTask,
      repairTools: vehicleSpec?.tools || [],
      vehicleSpec: vehicleSpec ?? undefined,
    });
    if (kg.groups.length > 0) {
      lines.push('## Related Components & Systems');
      lines.push('');
      for (const group of kg.groups) {
        lines.push(`### ${group.title}`);
        for (const node of group.nodes) {
          lines.push(`- **${escapeMarkdown(node.label)}**: ${escapeMarkdown(node.description || '')}`);
        }
        lines.push('');
      }
    }
  } catch {
    // KG optional
  }

  // Generated profile
  if (exactGuideProfile) {
    lines.push('## AI-Generated Repair Profile');
    lines.push('');
    if (exactGuideProfile.supportNote?.intro) {
      lines.push(escapeMarkdown(exactGuideProfile.supportNote.intro));
      lines.push('');
    }
    if (exactGuideProfile.supportNote?.bullets && exactGuideProfile.supportNote.bullets.length > 0) {
      for (const bullet of exactGuideProfile.supportNote.bullets) {
        lines.push(`- ${escapeMarkdown(bullet)}`);
      }
      lines.push('');
    }
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Source: AllOEMManuals.com — Factory service manual data for ${displayName}*`);
  lines.push(`*Task: ${taskTitle}*`);
  lines.push(`*Retrieved: ${new Date().toISOString()}*`);
  lines.push(`*License: Paid access via x402. Citation required. No resale.*`);
  lines.push('');

  return stripAffiliateLinks(lines.join('\n'));
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; make: string; model: string; section?: string[] }> }
) {
  const { year, make, model } = await params;
  const yearNum = parseInt(year, 10);

  if (isNaN(yearNum) || yearNum < 1960 || yearNum > 2025) {
    return NextResponse.json({ error: 'Invalid year. Must be 1960–2025.' }, { status: 400 });
  }

  const makeSlug = slugifyRoutePart(decodeURIComponent(make));
  const modelSlug = slugifyRoutePart(decodeURIComponent(model));
  const clampedYear = getClampedYear(year, makeSlug, modelSlug);
  const resolvedYear = clampedYear ?? yearNum;

  if (!isValidVehicleCombination(String(resolvedYear), makeSlug, modelSlug, '')) {
    return NextResponse.json({ error: 'Invalid vehicle combination' }, { status: 404 });
  }

  const access = await checkStripeAccess(request, request.nextUrl.pathname);
  if (!access.allowed) {
    return access.response ?? buildStripeRequiredResponse(request, request.nextUrl.pathname, 'missing_payment');
  }

  return new NextResponse(null, {
    status: 200,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; make: string; model: string; section?: string[] }> }
) {
  const { year, make, model, section } = await params;
  const yearNum = parseInt(year, 10);

  if (isNaN(yearNum) || yearNum < 1960 || yearNum > 2025) {
    return NextResponse.json({ error: 'Invalid year. Must be 1960–2025.' }, { status: 400 });
  }

  const makeSlug = slugifyRoutePart(decodeURIComponent(make));
  const modelSlug = slugifyRoutePart(decodeURIComponent(model));
  const clampedYear = getClampedYear(year, makeSlug, modelSlug);
  const resolvedYear = clampedYear ?? yearNum;

  // Validate basic vehicle existence (empty task for hub validation)
  if (!isValidVehicleCombination(String(resolvedYear), makeSlug, modelSlug, '')) {
    return NextResponse.json({ error: 'Invalid vehicle combination' }, { status: 404 });
  }

  const identity = canonicalizeVehicleIdentity({
    year: String(resolvedYear),
    make: decodeURIComponent(make),
    model: decodeURIComponent(model),
  });

  // Stripe credits gate (x402 is handled in middleware before this route runs)
  const pagePath = request.nextUrl.pathname;
  const access = await checkStripeAccess(request, pagePath);
  if (!access.allowed) {
    return access.response!;
  }

  let markdown: string | null = null;

  if (!section || section.length === 0) {
    // Full vehicle hub
    markdown = await buildHubMarkdown(resolvedYear, makeSlug, modelSlug, identity);
  } else if (section[0] === 'repairs' && section[1]) {
    // Specific repair guide
    markdown = await buildRepairMarkdown(resolvedYear, makeSlug, modelSlug, identity, section[1]);
    if (!markdown) {
      return NextResponse.json({ error: 'Invalid repair task for this vehicle' }, { status: 404 });
    }
  } else if (section[0] === 'dtc') {
    // DTC list only
    let laneData: Awaited<ReturnType<typeof buildVehicleLaneData>> = null;
    try {
      laneData = await buildVehicleLaneData(makeSlug, resolvedYear, modelSlug);
    } catch {
      // ignore
    }
    const displayName = `${resolvedYear} ${identity.displayMake} ${identity.displayModel}`;
    const lines: string[] = [];
    lines.push(`# Diagnostic Trouble Codes — ${displayName}`);
    lines.push('');
    if (laneData && laneData.dtcCodes.length > 0) {
      for (const dtc of laneData.dtcCodes) {
        lines.push(`## ${dtc.code}`);
        lines.push(`**Title:** ${escapeMarkdown(dtc.title)}`);
        lines.push(`**System:** ${dtc.system}`);
        if (dtc.related.length > 0) {
          lines.push('**Related Content:**');
          for (const rel of dtc.related.slice(0, 10)) {
            lines.push(`- [${rel.type}] ${escapeMarkdown(rel.title)}`);
          }
        }
        lines.push('');
      }
    } else {
      lines.push('No DTC codes available for this vehicle.');
    }
    lines.push('---');
    lines.push(`*Source: AllOEMManuals.com*`);
    markdown = stripAffiliateLinks(lines.join('\n'));
  } else if (section[0] === 'specs') {
    // Specifications only
    const toolPages = getToolPagesForVehicle(makeSlug, modelSlug);
    const displayName = `${resolvedYear} ${identity.displayMake} ${identity.displayModel}`;
    const lines: string[] = [];
    lines.push(`# Factory Specifications — ${displayName}`);
    lines.push('');
    for (const tp of toolPages) {
      const answer = getConciseQuickAnswer(resolvedYear, tp);
      if (answer) {
        lines.push(`## ${tp.title}`);
        lines.push(escapeMarkdown(answer));
        lines.push('');
      }
    }
    lines.push('---');
    lines.push(`*Source: AllOEMManuals.com*`);
    markdown = stripAffiliateLinks(lines.join('\n'));
  } else {
    return NextResponse.json(
      { error: 'Unknown section. Use: repairs/{task}, dtc, specs, or omit for full hub.' },
      { status: 400 }
    );
  }

  const response = new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept-Encoding, Authorization',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Payment-Info': JSON.stringify([X402_PAYMENT_INFO, {
        protocol: 'stripe',
        model: 'credits',
        price: '$0.01',
        per: 'page',
        checkout_url: 'https://alloemmanuals.com/api/stripe/checkout',
        account_url: 'https://alloemmanuals.com/api/account',
      }]),
      'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
    },
  });

  return attachCreditHeader(response, access.remaining);
}
