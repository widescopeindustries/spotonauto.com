import { isCanonicalHost } from '@/lib/host';

/**
 * analytics.ts — Consolidated GA4 event tracking for SpotOnAuto
 *
 * Single source of truth for all analytics events.
 * Uses window.gtag() with automatic UTM attribution via sessionStorage.
 *
 * Key events (configure in GA4 Admin > Events > Mark as key event):
 *   - guide_generated    (user got a repair guide)
 *   - affiliate_click    (user clicked an affiliate product link)
 *   - sign_up            (user created an account)
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// ─── UTM Capture ────────────────────────────────────────────────────────────

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'spotonauto_utm';

/** Capture UTM params from URL and persist in sessionStorage */
export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;
  if (!isCanonicalHost(window.location.hostname)) return;

  const params = new URLSearchParams(window.location.search);
  const utmData: Record<string, string> = {};
  let hasUTM = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      utmData[key] = value;
      hasUTM = true;
    }
  }

  const gclid = params.get('gclid');
  if (gclid) {
    utmData.gclid = gclid;
    hasUTM = true;
  }

  if (hasUTM) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));
  }
}

/** Get stored UTM params */
function getUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ─── Core ───────────────────────────────────────────────────────────────────

/** Safe gtag wrapper with automatic UTM attribution */
function trackEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (!isCanonicalHost(window.location.hostname)) return;

  const utmData = getUTMParams();
  window.gtag('event', eventName, {
    ...params,
    ...(utmData.utm_source && { campaign_source: utmData.utm_source }),
    ...(utmData.utm_medium && { campaign_medium: utmData.utm_medium }),
    ...(utmData.utm_campaign && { campaign_name: utmData.utm_campaign }),
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, params);
  }
}

// ─── Affiliate Events ───────────────────────────────────────────────────────

export type AffiliateProvider = 'Amazon';

interface AffiliateClickEvent {
  provider: AffiliateProvider;
  partName: string;
  vehicle: string;
  isHighTicket: boolean;
  pageType: 'repair_guide' | 'parts_page' | 'diagnostic';
}

export function trackAffiliateClick(event: AffiliateClickEvent): void {
  trackEvent('affiliate_click', {
    event_category: 'affiliate',
    event_label: `${event.provider}_${event.partName}`,
    provider: event.provider,
    part_name: event.partName,
    vehicle: event.vehicle,
    is_high_ticket: event.isHighTicket,
    page_type: event.pageType,
    value: event.isHighTicket ? 10 : 1,
  });
}

export function trackShopAllClick(provider: AffiliateProvider, vehicle: string): void {
  trackEvent('shop_all_click', {
    event_category: 'affiliate',
    event_label: provider,
    provider,
    vehicle,
    value: 5,
  });
}

export function trackToolClick(toolName: string, vehicle: string): void {
  trackEvent('tool_affiliate_click', {
    event_category: 'affiliate',
    event_label: toolName,
    tool_name: toolName,
    vehicle,
    value: 2,
  });
}

// ─── Guide & Repair Events ──────────────────────────────────────────────────

interface GuideGeneratedEvent {
  vehicle: string;
  task: string;
  partsCount: number;
  toolsCount: number;
  manualMode?: 'vector' | 'kv' | 'live' | 'none';
  manualSourceCount?: number;
}

export function trackGuideGenerated(event: GuideGeneratedEvent): void {
  trackEvent('guide_generated', {
    event_category: 'engagement',
    event_label: `${event.vehicle}_${event.task}`,
    vehicle: event.vehicle,
    task: event.task,
    parts_count: event.partsCount,
    tools_count: event.toolsCount,
    manual_mode: event.manualMode,
    manual_source_count: event.manualSourceCount,
  });
}

export function trackRetrievalBackbone(
  vehicle: string,
  task: string,
  manualMode: 'vector' | 'kv' | 'live' | 'none',
  manualSourceCount: number,
): void {
  trackEvent('manual_retrieval', {
    event_category: 'knowledge_backbone',
    event_label: `${vehicle}_${task}`,
    vehicle,
    task,
    manual_mode: manualMode,
    manual_source_count: manualSourceCount,
  });
}

export function trackRepairPageView(vehicle: string, task: string): void {
  trackEvent('repair_page_view', {
    event_category: 'engagement',
    event_label: `${vehicle}_${task}`,
    vehicle,
    task,
  });
}

export function trackRepairGuideOpen(vehicle: string, task: string): void {
  trackEvent('repair_guide_open', {
    event_category: 'funnel',
    event_label: `${vehicle}_${task}`,
    vehicle,
    task,
  });
}

// ─── Engagement Events ──────────────────────────────────────────────────────

export function trackVehicleSearch(vehicle: string, task: string, method: 'guide' | 'diagnose'): void {
  trackEvent('vehicle_search', {
    event_category: 'engagement',
    event_label: `${vehicle}_${task}`,
    vehicle,
    task,
    search_method: method,
  });
}

export function trackDiagnosticStart(vehicle: string): void {
  trackEvent('diagnostic_start', {
    event_category: 'engagement',
    event_label: vehicle,
    vehicle,
  });
}

export function trackVinDecode(vin: string, success: boolean): void {
  trackEvent('vin_decode', {
    event_category: 'engagement',
    event_label: success ? 'success' : 'failure',
    success,
  });
}

export function trackBookmarkClick(page: string): void {
  trackEvent('bookmark_click', {
    event_category: 'engagement',
    event_label: page,
    page,
  });
}

export type EntryRouteSurface =
  | 'home_hero'
  | 'home_alternate'
  | 'home_symptom_quick_start'
  | 'home_dashboard';

export type EntryRouteDestination =
  | 'diagnose'
  | 'symptom'
  | 'codes'
  | 'wiring'
  | 'repair'
  | 'vehicle_hub'
  | 'parts';

export function trackEntryRouteClick(
  surface: EntryRouteSurface,
  destination: EntryRouteDestination,
  label: string,
): void {
  trackEvent('entry_route_click', {
    event_category: 'funnel',
    event_label: `${surface}_${destination}`,
    entry_surface: surface,
    entry_destination: destination,
    entry_label: label.slice(0, 120),
  });
}

// ─── Wiring Events ──────────────────────────────────────────────────────────

export function trackWiringSeoView(vehicle: string, system: string): void {
  trackEvent('wiring_seo_view', {
    event_category: 'wiring',
    event_label: `${vehicle}_${system}`,
    vehicle,
    system,
  });
}

export function trackWiringCtaClick(
  vehicle: string,
  system: string,
  target:
    | 'interactive_library'
    | 'diagram_jump'
    | 'cluster_nav'
    | 'vehicle_hub'
    | 'repair_path'
    | 'code_path'
    | 'manual_path'
    | 'same_system_vehicle',
): void {
  trackEvent('wiring_cta_click', {
    event_category: 'wiring',
    event_label: `${system}_${target}`,
    vehicle,
    system,
    target,
  });
}

export function trackWiringDiagramOpen(vehicle: string, system: string, diagramName: string): void {
  trackEvent('wiring_diagram_open', {
    event_category: 'wiring',
    event_label: `${system}_${diagramName.slice(0, 60)}`,
    vehicle,
    system,
    diagram_name: diagramName.slice(0, 120),
  });
}

export function trackVehicleHubEnter(vehicle: string): void {
  trackEvent('vehicle_hub_enter', {
    event_category: 'funnel',
    event_label: vehicle,
    vehicle,
  });
}

// ─── Knowledge Graph Events ────────────────────────────────────────────────

export type KnowledgeGraphSurface = 'repair' | 'code' | 'wiring' | 'vehicle' | 'symptom';
export type KnowledgeGraphKind = 'manual' | 'spec' | 'tool' | 'wiring' | 'dtc' | 'repair' | 'vehicle' | 'symptom';

export interface KnowledgeGraphContext {
  vehicle?: string;
  task?: string;
  code?: string;
  system?: string;
}

interface KnowledgeGraphImpressionEvent extends KnowledgeGraphContext {
  surface: KnowledgeGraphSurface;
  groupKind: KnowledgeGraphKind;
  title: string;
  nodeCount: number;
}

interface KnowledgeGraphClickEvent extends KnowledgeGraphContext {
  surface: KnowledgeGraphSurface;
  sourceKind: KnowledgeGraphKind;
  targetKind: KnowledgeGraphKind;
  label: string;
  href: string;
  isBrowseLink?: boolean;
}

export function trackKnowledgeGraphImpression(event: KnowledgeGraphImpressionEvent): void {
  trackEvent('knowledge_graph_impression', {
    event_category: 'knowledge_graph',
    event_label: `${event.surface}_${event.groupKind}`,
    graph_surface: event.surface,
    graph_group: event.groupKind,
    graph_title: event.title,
    graph_node_count: event.nodeCount,
    vehicle: event.vehicle,
    task: event.task,
    code: event.code,
    system: event.system,
  });
}

export function trackKnowledgeGraphClick(event: KnowledgeGraphClickEvent): void {
  trackEvent('knowledge_graph_click', {
    event_category: 'knowledge_graph',
    event_label: `${event.surface}_${event.sourceKind}_${event.targetKind}`,
    graph_surface: event.surface,
    graph_group: event.sourceKind,
    graph_target_kind: event.targetKind,
    graph_label: event.label.slice(0, 120),
    graph_href: event.href.slice(0, 200),
    is_browse_link: event.isBrowseLink ? 'true' : 'false',
    vehicle: event.vehicle,
    task: event.task,
    code: event.code,
    system: event.system,
  });
}

// ─── Auth Events ────────────────────────────────────────────────────────────

export function trackAuth(method: 'google' | 'email', action: 'login' | 'signup'): void {
  trackEvent(action === 'signup' ? 'sign_up' : 'login', { method });
}

// ─── CEL Landing Page Events ────────────────────────────────────────────────

export const Analytics = {
  celPageView: () => trackEvent('cel_landing_view', { event_category: 'landing' }),

  vehicleSelected: (make: string, model: string, year: string) =>
    trackEvent('vehicle_selected', { make, model, year }),

  symptomEntered: (symptom: string) =>
    trackEvent('symptom_entered', { symptom: symptom.slice(0, 100) }),

  diagnoseClicked: (vehicle: string, symptom: string) =>
    trackEvent('diagnose_started', { vehicle, symptom: symptom.slice(0, 100) }),

  guideGenerated: (vehicle: string, task: string) =>
    trackEvent('guide_generated', { vehicle, task: task.slice(0, 100) }),

  celCodeSearch: (code: string) => trackEvent('cel_code_search', { code }),
  celCodeTap: (code: string) => trackEvent('cel_code_tap', { code }),
  celGetGuide: (code: string) => trackEvent('cel_get_guide', { code }),

  signupStarted: () => trackEvent('sign_up_started'),
  signupCompleted: (method: string) => trackEvent('sign_up', { method }),
  upgradeClicked: () => trackEvent('upgrade_clicked'),
  purchaseCompleted: (value: number) =>
    trackEvent('purchase', { value, currency: 'USD' }),
};
