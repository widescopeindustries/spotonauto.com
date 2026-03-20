import type { DiagnosticCrossLink } from '@/lib/diagnosticCrossLinks';
import {
  buildCodeNodeId,
  buildEdgeReference,
  buildWiringNodeId,
} from '@/lib/knowledgeGraph';
import {
  buildVehicleHubUrl,
  canonicalizeVehicleIdentity,
  parseVehicleNodeId,
} from '@/lib/vehicleIdentity';

type VehicleHubSource = 'manual' | 'repair' | 'wiring';

export interface VehicleHubLink {
  nodeId?: string;
  edgeId?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  vehicleNodeId?: string;
  taskNodeId?: string;
  systemNodeId?: string;
  codeNodeId?: string;
  href: string;
  label: string;
  description: string;
  badge: string;
}

function formatVehicleHubBadge(sources: Set<VehicleHubSource>): string {
  const labels = [
    sources.has('repair') ? 'Repair' : null,
    sources.has('wiring') ? 'Wiring' : null,
    sources.has('manual') ? 'Manual' : null,
  ].filter(Boolean);

  return labels.join(' + ') || 'Vehicle Hub';
}

function buildVehicleHubDescription(code: string, sources: Set<VehicleHubSource>): string {
  if (sources.has('repair') && sources.has('wiring')) {
    return `Open the exact vehicle hub tying together repair and wiring paths commonly associated with ${code}.`;
  }
  if (sources.has('repair') && sources.has('manual')) {
    return `Open the exact vehicle hub for a repair cluster backed by OEM manual evidence related to ${code}.`;
  }
  if (sources.has('wiring') && sources.has('manual')) {
    return `Open the exact vehicle hub linking OEM manual evidence and wiring paths relevant to ${code}.`;
  }
  if (sources.has('repair')) {
    return `Open the exact vehicle hub for a repair workflow commonly associated with ${code}.`;
  }
  if (sources.has('wiring')) {
    return `Open the exact vehicle hub for wiring diagnosis commonly associated with ${code}.`;
  }
  return `Open the exact vehicle hub grounded by OEM manual evidence related to ${code}.`;
}

export function buildVehicleHubLinkForWiring(args: {
  year: string | number;
  make: string;
  model: string;
  system: string;
}): VehicleHubLink {
  const identity = canonicalizeVehicleIdentity({
    year: args.year,
    make: args.make,
    model: args.model,
  });

  return {
    ...buildEdgeReference({
      sourceNodeId: buildWiringNodeId(args.year, args.make, args.model, args.system),
      targetNodeId: identity.nodeId,
      relation: 'has-vehicle',
      year: identity.year,
      make: identity.makeSlug,
      model: identity.modelSlug,
      system: args.system,
    }),
    href: buildVehicleHubUrl(identity.year, identity.makeSlug, identity.modelSlug),
    label: `${identity.year} ${identity.displayMake} ${identity.displayModel} Repair Hub`,
    description: `Open the exact vehicle hub for this wiring page to move into repair, manual, and code clusters without leaving the ${identity.year} ${identity.displayMake} ${identity.displayModel} context.`,
    badge: 'Exact Vehicle',
  };
}

export function buildVehicleHubLinksForCode(args: {
  code: string;
  repairLinks: DiagnosticCrossLink[];
  wiringLinks: DiagnosticCrossLink[];
  manualLinks: DiagnosticCrossLink[];
  limit?: number;
}): VehicleHubLink[] {
  const hubs = new Map<string, { href: string; label: string; sources: Set<VehicleHubSource>; ref: VehicleHubLink }>();
  const limit = Math.max(1, args.limit ?? 6);
  const sourceNodeId = buildCodeNodeId(args.code);

  const ingest = (links: DiagnosticCrossLink[], source: VehicleHubSource) => {
    for (const link of links) {
      if (!link.vehicleNodeId) continue;
      const parsed = parseVehicleNodeId(link.vehicleNodeId);
      if (!parsed) continue;

      const identity = canonicalizeVehicleIdentity({
        year: parsed.year,
        make: parsed.make,
        model: parsed.model,
      });
      const existing = hubs.get(identity.nodeId);
      if (existing) {
        existing.sources.add(source);
        continue;
      }

      hubs.set(identity.nodeId, {
        href: buildVehicleHubUrl(identity.year, identity.makeSlug, identity.modelSlug),
        label: `${identity.year} ${identity.displayMake} ${identity.displayModel} Repair Hub`,
        sources: new Set<VehicleHubSource>([source]),
        ref: {
          ...buildEdgeReference({
            sourceNodeId,
            targetNodeId: identity.nodeId,
            relation: 'has-vehicle',
            year: identity.year,
            make: identity.makeSlug,
            model: identity.modelSlug,
            code: args.code,
          }),
          href: buildVehicleHubUrl(identity.year, identity.makeSlug, identity.modelSlug),
          label: `${identity.year} ${identity.displayMake} ${identity.displayModel} Repair Hub`,
          description: '',
          badge: '',
        },
      });
    }
  };

  ingest(args.repairLinks, 'repair');
  ingest(args.wiringLinks, 'wiring');
  ingest(args.manualLinks, 'manual');

  return [...hubs.values()]
    .sort((a, b) => b.sources.size - a.sources.size || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((entry) => ({
      ...entry.ref,
      description: buildVehicleHubDescription(args.code, entry.sources),
      badge: formatVehicleHubBadge(entry.sources),
    }));
}
