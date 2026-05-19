/**
 * clarity.ts — Microsoft Clarity tracking wrapper for AllOEMManuals
 *
 * Mirrors critical business events from GA4 into Clarity for session replay
 * correlation. Also provides session-level tagging for filtering recordings.
 *
 * Tags (session-scoped filters in Clarity):
 *   - page_type        : homepage | vehicle_hub | repair_guide | maintenance | tool | dtc | wiring | diagnose | search | parts | codes | other
 *   - vehicle_known    : yes | no
 *   - vehicle_year     : extracted from URL
 *   - vehicle_make     : extracted from URL
 *   - vehicle_model    : extracted from URL
 *   - content_depth    : corpus | tool_page | generic
 *   - traffic_source   : organic | direct | referral | social | unknown
 *
 * Events (action-level, visible in Clarity recordings):
 *   - affiliate_click, vehicle_selected, guide_generated, diagnostic_start,
 *     search_submitted, vehicle_hub_enter, repair_guide_open, wiring_diagram_open
 */

import Clarity from '@microsoft/clarity';
import { isCanonicalHost } from '@/lib/host';

const isReady = () => typeof window !== 'undefined' && isCanonicalHost(window.location.hostname);

/** Safely call Clarity.setTag — ignores if not on canonical host */
export function claritySetTag(key: string, value: string | string[]): void {
  if (!isReady()) return;
  try {
    Clarity.setTag(key, value);
  } catch {
    // Clarity not loaded yet or blocked
  }
}

/** Safely call Clarity.event */
export function clarityEvent(name: string, metadata?: Record<string, string | number | boolean>): void {
  if (!isReady()) return;
  try {
    if (metadata && Object.keys(metadata).length > 0) {
      // Clarity.event only takes a name; metadata goes into tags
      Clarity.event(name);
      Object.entries(metadata).forEach(([k, v]) => {
        Clarity.setTag(`evt_${name}_${k}`, String(v).slice(0, 100));
      });
    } else {
      Clarity.event(name);
    }
  } catch {
    // noop
  }
}

/** Safely call Clarity.identify */
export function clarityIdentify(customId: string, friendlyName?: string): void {
  if (!isReady()) return;
  try {
    Clarity.identify(customId, undefined, undefined, friendlyName);
  } catch {
    // noop
  }
}

/** Safely call Clarity.upgrade — prioritizes session for recording */
export function clarityUpgrade(reason: string): void {
  if (!isReady()) return;
  try {
    Clarity.upgrade(reason);
  } catch {
    // noop
  }
}

// ─── Derive tags from current URL ───────────────────────────────────────────

export type ClarityPageType =
  | 'homepage'
  | 'vehicle_hub'
  | 'repair_guide'
  | 'maintenance'
  | 'tool'
  | 'dtc'
  | 'wiring'
  | 'diagnose'
  | 'search'
  | 'parts'
  | 'codes'
  | 'other';

export interface ClarityPageTags {
  page_type: ClarityPageType;
  vehicle_known: 'yes' | 'no';
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  content_depth: 'corpus' | 'tool_page' | 'generic';
  traffic_source: string;
}

export function deriveClarityPageTags(pathname: string, search: string): ClarityPageTags {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Vehicle extraction: /vehicles/2012/toyota/camry or /repair/2012/toyota/camry/...
  let vehicle_known: 'yes' | 'no' = 'no';
  let vehicle_year: string | undefined;
  let vehicle_make: string | undefined;
  let vehicle_model: string | undefined;

  const yearIdx = segments.findIndex((s) => /^\d{4}$/.test(s));
  if (yearIdx >= 1) {
    vehicle_year = segments[yearIdx];
    vehicle_make = segments[yearIdx + 1];
    vehicle_model = segments[yearIdx + 2];
    if (vehicle_year && vehicle_make && vehicle_model) {
      vehicle_known = 'yes';
    }
  }

  // Page type
  let page_type: ClarityPageType = 'other';
  if (pathname === '/' || pathname === '') page_type = 'homepage';
  else if (first === 'vehicles') page_type = 'vehicle_hub';
  else if (first === 'repair') page_type = 'repair_guide';
  else if (first === 'maintenance') page_type = 'maintenance';
  else if (first === 'tools') page_type = 'tool';
  else if (first === 'wiring') page_type = 'wiring';
  else if (first === 'diagnose' || first === 'cel') page_type = 'diagnose';
  else if (first === 'parts') page_type = 'parts';
  else if (first === 'codes') page_type = 'dtc';
  else if (first === 'search') page_type = 'search';

  // Content depth
  let content_depth: 'corpus' | 'tool_page' | 'generic' = 'generic';
  if (first === 'repair' || first === 'vehicles' || first === 'wiring' || first === 'codes') {
    content_depth = 'corpus';
  } else if (first === 'tools' || first === 'maintenance') {
    content_depth = 'tool_page';
  }

  // Traffic source from URL or referrer
  const params = new URLSearchParams(search);
  let traffic_source = params.get('utm_source') || 'unknown';
  if (traffic_source === 'unknown' && typeof document !== 'undefined') {
    const ref = document.referrer;
    if (!ref) traffic_source = 'direct';
    else if (ref.includes('google')) traffic_source = 'organic';
    else if (ref.includes('bing')) traffic_source = 'organic';
    else if (ref.includes('yahoo')) traffic_source = 'organic';
    else if (ref.includes('facebook') || ref.includes('instagram') || ref.includes('x.com') || ref.includes('twitter')) traffic_source = 'social';
    else traffic_source = 'referral';
  }

  return {
    page_type,
    vehicle_known,
    vehicle_year,
    vehicle_make,
    vehicle_model,
    content_depth,
    traffic_source,
  };
}

/** Apply all page tags to the current Clarity session */
export function applyClarityPageTags(tags: ClarityPageTags): void {
  if (!isReady()) return;
  claritySetTag('page_type', tags.page_type);
  claritySetTag('vehicle_known', tags.vehicle_known);
  claritySetTag('content_depth', tags.content_depth);
  claritySetTag('traffic_source', tags.traffic_source);
  if (tags.vehicle_year) claritySetTag('vehicle_year', tags.vehicle_year);
  if (tags.vehicle_make) claritySetTag('vehicle_make', tags.vehicle_make);
  if (tags.vehicle_model) claritySetTag('vehicle_model', tags.vehicle_model);
}
