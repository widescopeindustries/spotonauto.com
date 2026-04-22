import { isCanonicalHost } from '@/lib/host';
import {
  buildAnalyticsContext,
  deriveIntentCluster,
  parseVehicleLabel,
  type AnalyticsContextInput,
  type AnalyticsIntentCluster,
  type AnalyticsPageSurface,
} from '@/lib/analyticsContext';

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
 *   - repair_answer_impression / repair_answer_click (repair answer-layer engagement)
 *   - guide_step_view / guide_step_expand / guide_completion (guide progression)
 *   - wiring_diagram_search / wiring_system_toggle / wiring_diagram_exit / wiring_diagram_interact (wiring engagement)
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

function clampText(value: string, maxLength = 120): string {
  return String(value || '').slice(0, maxLength);
}

function bucketGuideStep(step: number, totalSteps?: number): string {
  const normalized = Number(step || 0);
  if (!normalized || normalized < 0) return 'unknown';
  if (normalized === 1) return 'step_1';
  if (normalized === 2) return 'step_2';
  if (totalSteps && normalized >= totalSteps) return 'last';
  if (normalized <= 4) return 'step_3_4';
  if (normalized <= 7) return 'step_5_7';
  return 'step_8_plus';
}

function bucketSearchLength(query: string): string {
  const length = String(query || '').trim().length;
  if (!length) return 'empty';
  if (length <= 12) return 'short';
  if (length <= 24) return 'medium';
  return 'long';
}

function bucketSearchResults(resultCount?: number): string {
  const normalized = Number(resultCount);
  if (!Number.isFinite(normalized) || normalized < 0) return 'unknown';
  if (normalized === 0) return 'none';
  if (normalized <= 3) return '1_3';
  if (normalized <= 10) return '4_10';
  if (normalized <= 25) return '11_25';
  return '26_plus';
}

export type RepairAnswerCtaLayer = 'primary' | 'secondary' | 'supporting' | 'reference' | 'other';
export type RepairAnswerCtaKind = 'guide' | 'vehicle_hub' | 'manual' | 'parts' | 'tool' | 'diagram' | 'other';
export type GuideStepAction = 'view' | 'expand';
export type GuideCompletionReason = 'all_steps_viewed' | 'last_step_viewed' | 'manual_complete';
export type WiringDiagramAction =
  | 'open'
  | 'close'
  | 'zoom_in'
  | 'zoom_out'
  | 'reset_zoom'
  | 'download'
  | 'copy_link'
  | 'share'
  | 'image_prev'
  | 'image_next';
export type WiringDiagramSearchScope = 'diagram_library' | 'system_list' | 'modal' | 'deep_link' | 'other';
export type WiringSystemToggleAction = 'expand' | 'collapse';
export type WiringDiagramExitKind = 'close_button' | 'backdrop' | 'escape' | 'reset' | 'other';

function deriveRepairAnswerCtaKind(target: string, href?: string): RepairAnswerCtaKind {
  const targetText = String(target || '').toLowerCase();
  const hrefText = String(href || '').toLowerCase();
  if (targetText.includes('vehicle_hub')) return 'vehicle_hub';
  if (targetText.includes('guide') || hrefText.includes('/repair/')) return 'guide';
  if (targetText.includes('manual') || hrefText.includes('/manual')) return 'manual';
  if (targetText.includes('parts')) return 'parts';
  if (targetText.includes('tool') || hrefText.includes('/tools/')) return 'tool';
  if (targetText.includes('diagram') || hrefText.includes('/wiring')) return 'diagram';
  return 'other';
}

function deriveRepairAnswerCtaLayer(section: string, kind: RepairAnswerCtaKind): RepairAnswerCtaLayer {
  const normalizedSection = String(section || '').toLowerCase();
  if (normalizedSection === 'hero' || normalizedSection === 'quick_answer') return 'primary';
  if (kind === 'guide' || kind === 'vehicle_hub') return 'secondary';
  if (kind === 'manual' || kind === 'diagram') return 'reference';
  if (kind === 'parts' || kind === 'tool') return 'supporting';
  if (normalizedSection.includes('support')) return 'supporting';
  return 'other';
}

// ─── Affiliate Events ───────────────────────────────────────────────────────

export type AffiliateProvider = 'Amazon' | 'Topdon';

interface AffiliateClickEvent {
  provider: AffiliateProvider;
  partName: string;
  vehicle: string;
  isHighTicket: boolean;
  pageType: 'repair_guide' | 'parts_page' | 'diagnostic';
}

function pageTypeToSurface(pageType: AffiliateClickEvent['pageType']): AnalyticsPageSurface {
  if (pageType === 'repair_guide') return 'repair_guide';
  if (pageType === 'parts_page') return 'parts';
  return 'diagnostic';
}

export function trackAffiliateClick(event: AffiliateClickEvent, context: AnalyticsContextInput = {}): void {
  const pageSurface = pageTypeToSurface(event.pageType);
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(event.vehicle),
    pageSurface,
    intentCluster: context.intentCluster || (pageSurface === 'parts' ? 'parts' : pageSurface === 'diagnostic' ? 'diagnostic' : deriveIntentCluster({
      pageSurface,
      vehicle: event.vehicle,
    })),
    ...context,
  });

  trackEvent('affiliate_click', {
    event_category: 'affiliate',
    event_label: `${event.provider}_${event.partName}`,
    provider: event.provider,
    part_name: event.partName,
    vehicle: event.vehicle,
    is_high_ticket: event.isHighTicket,
    page_type: event.pageType,
    value: event.isHighTicket ? 10 : 1,
    ...structuredContext,
  });
}

export function trackShopAllClick(provider: AffiliateProvider, vehicle: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: 'parts',
    intentCluster: context.intentCluster || 'parts',
    ...context,
  });

  trackEvent('shop_all_click', {
    event_category: 'affiliate',
    event_label: provider,
    provider,
    vehicle,
    value: 5,
    ...structuredContext,
  });
}

export function trackToolClick(toolName: string, vehicle: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: context.pageSurface || 'repair_guide',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: 'repair_guide',
      task: context.taskSlug || context.task,
      vehicle,
    }),
    ...context,
  });

  trackEvent('tool_affiliate_click', {
    event_category: 'affiliate',
    event_label: toolName,
    tool_name: toolName,
    vehicle,
    value: 2,
    ...structuredContext,
  });
}

// ─── Guide & Repair Events ──────────────────────────────────────────────────

interface GuideGeneratedEvent {
  vehicle: string;
  task: string;
  partsCount: number;
  toolsCount: number;
  manualMode?: 'graph' | 'hybrid' | 'vector' | 'kv' | 'live' | 'none';
  manualSourceCount?: number;
  taskSlug?: string;
  pageSurface?: AnalyticsPageSurface;
  intentCluster?: AnalyticsIntentCluster;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export function trackGuideGenerated(event: GuideGeneratedEvent): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || 'repair_guide',
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || 'repair_guide',
      task: event.taskSlug || event.task,
    }),
    taskSlug: event.taskSlug || event.task,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('guide_generated', {
    event_category: 'engagement',
    event_label: `${structuredContext.page_surface || 'repair_guide'}_${structuredContext.intent_cluster || 'other'}`,
    vehicle: event.vehicle,
    task: event.task,
    parts_count: event.partsCount,
    tools_count: event.toolsCount,
    manual_mode: event.manualMode,
    manual_source_count: event.manualSourceCount,
    ...structuredContext,
  });
}

export function trackRetrievalBackbone(
  vehicle: string,
  task: string,
  manualMode: 'graph' | 'hybrid' | 'vector' | 'kv' | 'live' | 'none',
  manualSourceCount: number,
  context: AnalyticsContextInput = {},
): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: context.pageSurface || 'repair_guide',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: context.pageSurface || 'repair_guide',
      task: context.taskSlug || task,
    }),
    taskSlug: context.taskSlug || task,
    vehicle,
    ...context,
  });

  trackEvent('manual_retrieval', {
    event_category: 'knowledge_backbone',
    event_label: `${structuredContext.page_surface || 'repair_guide'}_${structuredContext.intent_cluster || 'other'}`,
    vehicle,
    task,
    manual_mode: manualMode,
    manual_source_count: manualSourceCount,
    ...structuredContext,
  });
}

export function trackRepairPageView(vehicle: string, task: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: context.pageSurface || 'repair_guide',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: context.pageSurface || 'repair_guide',
      task: context.taskSlug || task,
    }),
    taskSlug: context.taskSlug || task,
    vehicle,
    ...context,
  });

  trackEvent('repair_page_view', {
    event_category: 'engagement',
    event_label: `${structuredContext.page_surface || 'repair_guide'}_${structuredContext.intent_cluster || 'other'}`,
    vehicle,
    task,
    ...structuredContext,
  });
}

export function trackRepairGuideOpen(vehicle: string, task: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: context.pageSurface || 'repair_guide',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: context.pageSurface || 'repair_guide',
      task: context.taskSlug || task,
    }),
    taskSlug: context.taskSlug || task,
    vehicle,
    ...context,
  });

  trackEvent('repair_guide_open', {
    event_category: 'funnel',
    event_label: `${structuredContext.page_surface || 'repair_guide'}_${structuredContext.intent_cluster || 'other'}`,
    vehicle,
    task,
    ...structuredContext,
  });
}

interface RepairAnswerImpressionEvent {
  vehicle: string;
  task: string;
  section: string;
  label?: string;
  target?: string;
  itemCount?: number;
  pageSurface?: AnalyticsPageSurface;
  taskSlug?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

interface RepairAnswerClickEvent {
  vehicle: string;
  task: string;
  section: string;
  target: string;
  label: string;
  href?: string;
  ctaLayer?: RepairAnswerCtaLayer;
  ctaKind?: RepairAnswerCtaKind;
  pageSurface?: AnalyticsPageSurface;
  taskSlug?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export function trackRepairAnswerImpression(event: RepairAnswerImpressionEvent): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || 'repair_guide',
    intentCluster: deriveIntentCluster({
      pageSurface: event.pageSurface || 'repair_guide',
      task: event.taskSlug || event.task,
    }),
    taskSlug: event.taskSlug || event.task,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('repair_answer_impression', {
    event_category: 'repair_answer',
    event_label: `${event.section}_${event.label || 'impression'}`.slice(0, 120),
    vehicle: event.vehicle,
    task: event.task,
    page_surface: structuredContext.page_surface,
    intent_cluster: structuredContext.intent_cluster,
    task_slug: structuredContext.task_slug,
    vehicle_year: structuredContext.vehicle_year,
    vehicle_make: structuredContext.vehicle_make,
    vehicle_model: structuredContext.vehicle_model,
    repair_answer_section: event.section,
    repair_answer_target: event.target,
    repair_answer_label: event.label?.slice(0, 120),
    item_count: event.itemCount,
  });
}

export function trackRepairAnswerClick(event: RepairAnswerClickEvent): void {
  const ctaKind = event.ctaKind || deriveRepairAnswerCtaKind(event.target, event.href);
  const ctaLayer = event.ctaLayer || deriveRepairAnswerCtaLayer(event.section, ctaKind);
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || 'repair_guide',
    intentCluster: deriveIntentCluster({
      pageSurface: event.pageSurface || 'repair_guide',
      task: event.taskSlug || event.task,
    }),
    taskSlug: event.taskSlug || event.task,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('repair_answer_click', {
    event_category: 'repair_answer',
    event_label: `${event.section}_${event.target}`,
    vehicle: event.vehicle,
    task: event.task,
    page_surface: structuredContext.page_surface,
    intent_cluster: structuredContext.intent_cluster,
    task_slug: structuredContext.task_slug,
    vehicle_year: structuredContext.vehicle_year,
    vehicle_make: structuredContext.vehicle_make,
    vehicle_model: structuredContext.vehicle_model,
    repair_answer_section: event.section,
    repair_answer_target: event.target,
    repair_answer_label: clampText(event.label),
    repair_answer_cta_layer: ctaLayer,
    repair_answer_cta_kind: ctaKind,
    href: event.href?.slice(0, 200),
  });
}

interface GuideStepEvent {
  vehicle: string;
  task: string;
  step: number;
  totalSteps?: number;
  stepLabel?: string;
  pageSurface?: AnalyticsPageSurface;
  taskSlug?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

interface GuideCompletionEvent {
  vehicle: string;
  task: string;
  reason?: GuideCompletionReason;
  totalSteps?: number;
  viewedSteps?: number;
  pageSurface?: AnalyticsPageSurface;
  taskSlug?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export function trackGuideStepView(event: GuideStepEvent): void {
  const stepBucket = bucketGuideStep(event.step, event.totalSteps);
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || 'repair_guide',
    intentCluster: deriveIntentCluster({
      pageSurface: event.pageSurface || 'repair_guide',
      task: event.taskSlug || event.task,
    }),
    taskSlug: event.taskSlug || event.task,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('guide_step_view', {
    event_category: 'engagement',
    event_label: `step_${event.step}`,
    vehicle: event.vehicle,
    task: event.task,
    guide_step: String(event.step),
    guide_step_bucket: stepBucket,
    guide_step_action: 'view',
    guide_step_label: clampText(event.stepLabel || ''),
    ...structuredContext,
  });
}

export function trackGuideStepExpand(event: GuideStepEvent): void {
  const stepBucket = bucketGuideStep(event.step, event.totalSteps);
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || 'repair_guide',
    intentCluster: deriveIntentCluster({
      pageSurface: event.pageSurface || 'repair_guide',
      task: event.taskSlug || event.task,
    }),
    taskSlug: event.taskSlug || event.task,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('guide_step_expand', {
    event_category: 'engagement',
    event_label: `step_${event.step}`,
    vehicle: event.vehicle,
    task: event.task,
    guide_step: String(event.step),
    guide_step_bucket: stepBucket,
    guide_step_action: 'expand',
    guide_step_label: clampText(event.stepLabel || ''),
    ...structuredContext,
  });
}

export function trackGuideCompletion(event: GuideCompletionEvent): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || 'repair_guide',
    intentCluster: deriveIntentCluster({
      pageSurface: event.pageSurface || 'repair_guide',
      task: event.taskSlug || event.task,
    }),
    taskSlug: event.taskSlug || event.task,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  const reason = event.reason || (typeof event.totalSteps === 'number' && typeof event.viewedSteps === 'number' && event.viewedSteps >= event.totalSteps
    ? 'all_steps_viewed'
    : 'last_step_viewed');

  trackEvent('guide_completion', {
    event_category: 'engagement',
    event_label: reason,
    vehicle: event.vehicle,
    task: event.task,
    guide_completion_reason: reason,
    guide_completion_total_steps: event.totalSteps,
    guide_completion_viewed_steps: event.viewedSteps,
    ...structuredContext,
  });
}

// ─── Engagement Events ──────────────────────────────────────────────────────

export function trackVehicleSearch(
  vehicle: string,
  task: string,
  method: 'guide' | 'diagnose',
  context: AnalyticsContextInput = {},
): void {
  const pageSurface: AnalyticsPageSurface = method === 'guide' ? 'repair_guide' : 'diagnostic';
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface,
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface,
      task: context.taskSlug || task,
      vehicle,
    }),
    taskSlug: context.taskSlug || task,
    vehicle,
    ...context,
  });

  trackEvent('vehicle_search', {
    event_category: 'engagement',
    event_label: `${structuredContext.page_surface || pageSurface}_${structuredContext.intent_cluster || 'other'}`,
    vehicle,
    task,
    search_method: method,
    ...structuredContext,
  });
}

export function trackDiagnosticStart(vehicle: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: 'diagnostic',
    intentCluster: context.intentCluster || 'diagnostic',
    vehicle,
    ...context,
  });

  trackEvent('diagnostic_start', {
    event_category: 'engagement',
    event_label: 'diagnostic',
    vehicle,
    ...structuredContext,
  });
}

export function trackVinDecode(vin: string, success: boolean, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: 'diagnostic',
    intentCluster: context.intentCluster || 'diagnostic',
    vehicle: context.vehicle,
    ...context,
  });

  trackEvent('vin_decode', {
    event_category: 'engagement',
    event_label: success ? 'success' : 'failure',
    success,
    ...structuredContext,
  });
}

export function trackBookmarkClick(page: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: context.pageSurface || 'other',
    intentCluster: context.intentCluster || 'other',
    ...context,
  });

  trackEvent('bookmark_click', {
    event_category: 'engagement',
    event_label: page,
    page,
    ...structuredContext,
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
  context: AnalyticsContextInput = {},
): void {
  const intentCluster: AnalyticsIntentCluster =
    destination === 'wiring'
      ? 'wiring'
      : destination === 'repair'
        ? 'repair'
        : destination === 'vehicle_hub'
          ? 'vehicle_hub'
          : destination === 'parts'
            ? 'parts'
            : 'diagnostic';
  const structuredContext = buildAnalyticsContext({
    pageSurface: 'home',
    intentCluster: context.intentCluster || intentCluster,
    vehicle: context.vehicle,
    taskSlug: context.taskSlug,
    ...context,
  });

  trackEvent('entry_route_click', {
    event_category: 'funnel',
    event_label: `${surface}_${destination}`,
    entry_surface: surface,
    entry_destination: destination,
    entry_label: label.slice(0, 120),
    ...structuredContext,
  });
}

// ─── Wiring Events ──────────────────────────────────────────────────────────

export function trackWiringSeoView(vehicle: string, system: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: 'wiring',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: 'wiring',
      system,
      code: context.code,
      vehicle,
    }),
    systemSlug: context.systemSlug || system,
    vehicle,
    ...context,
  });

  trackEvent('wiring_seo_view', {
    event_category: 'wiring',
    event_label: `wiring_${structuredContext.system_slug || system}`,
    vehicle,
    system,
    ...structuredContext,
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
  context: AnalyticsContextInput = {},
): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: 'wiring',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: 'wiring',
      system,
      vehicle,
    }),
    systemSlug: context.systemSlug || system,
    vehicle,
    ...context,
  });

  trackEvent('wiring_cta_click', {
    event_category: 'wiring',
    event_label: `${system}_${target}`,
    vehicle,
    system,
    target,
    ...structuredContext,
  });
}

export function trackWiringDiagramOpen(
  vehicle: string,
  system: string,
  diagramName: string,
  context: AnalyticsContextInput = {},
): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: 'wiring',
    intentCluster: context.intentCluster || deriveIntentCluster({
      pageSurface: 'wiring',
      system,
      vehicle,
    }),
    systemSlug: context.systemSlug || system,
    vehicle,
    ...context,
  });

  trackEvent('wiring_diagram_open', {
    event_category: 'wiring',
    event_label: `${structuredContext.system_slug || 'wiring'}_diagram`,
    vehicle,
    system,
    diagram_name: diagramName.slice(0, 120),
    ...structuredContext,
  });
}

interface WiringDiagramSearchEvent {
  vehicle: string;
  system: string;
  query: string;
  resultCount?: number;
  scope?: WiringDiagramSearchScope;
  pageSurface?: AnalyticsPageSurface;
  systemSlug?: string;
  intentCluster?: AnalyticsIntentCluster;
  code?: string;
  codeFamily?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

interface WiringSystemToggleEvent {
  vehicle: string;
  system: string;
  action: WiringSystemToggleAction;
  diagramCount?: number;
  scope?: WiringDiagramSearchScope;
  pageSurface?: AnalyticsPageSurface;
  systemSlug?: string;
  intentCluster?: AnalyticsIntentCluster;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

interface WiringDiagramExitEvent {
  vehicle: string;
  system: string;
  kind?: WiringDiagramExitKind;
  openDiagrams?: number;
  pageSurface?: AnalyticsPageSurface;
  systemSlug?: string;
  intentCluster?: AnalyticsIntentCluster;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

interface WiringDiagramInteractEvent {
  vehicle: string;
  system: string;
  action: WiringDiagramAction;
  diagramName?: string;
  interactionTarget?: string;
  pageSurface?: AnalyticsPageSurface;
  systemSlug?: string;
  intentCluster?: AnalyticsIntentCluster;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export function trackWiringDiagramSearch(event: WiringDiagramSearchEvent): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(event.vehicle),
    pageSurface: event.pageSurface || 'wiring',
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || 'wiring',
      system: event.system,
      vehicle: event.vehicle,
    }),
    systemSlug: event.systemSlug || event.system,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('wiring_diagram_search', {
    event_category: 'wiring',
    event_label: `${structuredContext.system_slug || event.system}_search`,
    vehicle: event.vehicle,
    system: event.system,
    wiring_search_scope: event.scope || 'diagram_library',
    wiring_search_length_bucket: bucketSearchLength(event.query),
    wiring_search_result_bucket: bucketSearchResults(event.resultCount),
    ...structuredContext,
  });
}

export function trackWiringSystemToggle(event: WiringSystemToggleEvent): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(event.vehicle),
    pageSurface: event.pageSurface || 'wiring',
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || 'wiring',
      system: event.system,
      vehicle: event.vehicle,
    }),
    systemSlug: event.systemSlug || event.system,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('wiring_system_toggle', {
    event_category: 'wiring',
    event_label: `${event.system}_${event.action}`,
    vehicle: event.vehicle,
    system: event.system,
    wiring_system_action: event.action,
    wiring_system_diagram_count: event.diagramCount,
    wiring_search_scope: event.scope || 'system_list',
    ...structuredContext,
  });
}

export function trackWiringDiagramExit(event: WiringDiagramExitEvent): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(event.vehicle),
    pageSurface: event.pageSurface || 'wiring',
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || 'wiring',
      system: event.system,
      vehicle: event.vehicle,
    }),
    systemSlug: event.systemSlug || event.system,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('wiring_diagram_exit', {
    event_category: 'wiring',
    event_label: `${event.system}_${event.kind || 'other'}`,
    vehicle: event.vehicle,
    system: event.system,
    wiring_exit_kind: event.kind || 'other',
    wiring_open_diagrams: event.openDiagrams,
    ...structuredContext,
  });
}

export function trackWiringDiagramInteract(event: WiringDiagramInteractEvent): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(event.vehicle),
    pageSurface: event.pageSurface || 'wiring',
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || 'wiring',
      system: event.system,
      vehicle: event.vehicle,
    }),
    systemSlug: event.systemSlug || event.system,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

  trackEvent('wiring_diagram_interact', {
    event_category: 'wiring',
    event_label: `${event.system}_${event.action}`,
    vehicle: event.vehicle,
    system: event.system,
    wiring_diagram_action: event.action,
    wiring_diagram_name: clampText(event.diagramName || ''),
    wiring_interaction_target: clampText(event.interactionTarget || ''),
    ...structuredContext,
  });
}

export function trackVehicleHubEnter(vehicle: string, context: AnalyticsContextInput = {}): void {
  const structuredContext = buildAnalyticsContext({
    ...parseVehicleLabel(vehicle),
    pageSurface: 'vehicle_hub',
    intentCluster: context.intentCluster || 'vehicle_hub',
    vehicle,
    ...context,
  });

  trackEvent('vehicle_hub_enter', {
    event_category: 'funnel',
    event_label: 'vehicle_hub',
    vehicle,
    ...structuredContext,
  });
}

// ─── Knowledge Graph Events ────────────────────────────────────────────────

export type KnowledgeGraphSurface = 'repair' | 'code' | 'wiring' | 'vehicle' | 'symptom';
export type KnowledgeGraphKind = 'manual' | 'spec' | 'tool' | 'wiring' | 'dtc' | 'repair' | 'vehicle' | 'symptom';

export interface KnowledgeGraphContext {
  vehicle?: string;
  task?: string;
  taskSlug?: string;
  code?: string;
  codeFamily?: string;
  system?: string;
  systemSlug?: string;
  pageSurface?: AnalyticsPageSurface;
  intentCluster?: AnalyticsIntentCluster;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
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
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || (event.surface === 'vehicle' ? 'vehicle_hub' : event.surface === 'repair' ? 'repair_guide' : event.surface),
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || (event.surface === 'vehicle' ? 'vehicle_hub' : event.surface === 'repair' ? 'repair_guide' : event.surface),
      task: event.taskSlug || event.task,
      system: event.systemSlug || event.system,
      code: event.code,
      vehicle: event.vehicle,
    }),
    taskSlug: event.taskSlug || event.task,
    systemSlug: event.systemSlug || event.system,
    codeFamily: event.codeFamily,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

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
    ...structuredContext,
  });
}

export function trackKnowledgeGraphClick(event: KnowledgeGraphClickEvent): void {
  const structuredContext = buildAnalyticsContext({
    pageSurface: event.pageSurface || (event.surface === 'vehicle' ? 'vehicle_hub' : event.surface === 'repair' ? 'repair_guide' : event.surface),
    intentCluster: event.intentCluster || deriveIntentCluster({
      pageSurface: event.pageSurface || (event.surface === 'vehicle' ? 'vehicle_hub' : event.surface === 'repair' ? 'repair_guide' : event.surface),
      task: event.taskSlug || event.task,
      system: event.systemSlug || event.system,
      code: event.code,
      vehicle: event.vehicle,
    }),
    taskSlug: event.taskSlug || event.task,
    systemSlug: event.systemSlug || event.system,
    codeFamily: event.codeFamily,
    vehicleYear: event.vehicleYear,
    vehicleMake: event.vehicleMake,
    vehicleModel: event.vehicleModel,
    vehicle: event.vehicle,
  });

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
    ...structuredContext,
  });
}

// ─── Auth Events ────────────────────────────────────────────────────────────

export function trackAuth(method: 'google' | 'email', action: 'login' | 'signup'): void {
  trackEvent(action === 'signup' ? 'sign_up' : 'login', { method });
}

// ─── Revenue Funnel Events ──────────────────────────────────────────────────

type PricingCtaTarget = 'starter_free' | 'pro_checkout' | 'pro_waitlist';

export function trackPricingView(): void {
  trackEvent('pricing_view', {
    event_category: 'revenue_funnel',
    event_label: 'pricing_page',
    ...buildAnalyticsContext({
      pageSurface: 'other',
      intentCluster: 'other',
    }),
  });
}

export function trackPricingCtaClick(target: PricingCtaTarget, label: string): void {
  trackEvent('pricing_cta_click', {
    event_category: 'revenue_funnel',
    event_label: `${target}_${label}`.slice(0, 120),
    pricing_target: target,
    pricing_label: label.slice(0, 80),
    ...buildAnalyticsContext({
      pageSurface: 'other',
      intentCluster: 'other',
    }),
  });
}

export function trackSecondOpinionView(): void {
  trackEvent('second_opinion_view', {
    event_category: 'revenue_funnel',
    event_label: 'second_opinion_page',
    ...buildAnalyticsContext({
      pageSurface: 'diagnostic',
      intentCluster: 'diagnostic',
    }),
  });
}

export type SecondOpinionInputMode = 'manual_only' | 'image_only' | 'manual_plus_image';

export function trackSecondOpinionSubmit(hasSymptoms: boolean, inputMode: SecondOpinionInputMode): void {
  trackEvent('second_opinion_submit', {
    event_category: 'revenue_funnel',
    event_label: hasSymptoms ? 'with_symptoms' : 'without_symptoms',
    second_opinion_input_mode: inputMode,
    ...buildAnalyticsContext({
      pageSurface: 'diagnostic',
      intentCluster: 'diagnostic',
    }),
  });
}

export function trackSecondOpinionResult(
  verdict: string,
  inputMode: SecondOpinionInputMode,
  extractedFromImage: boolean
): void {
  trackEvent('second_opinion_result', {
    event_category: 'revenue_funnel',
    event_label: String(verdict || 'unknown').slice(0, 80).toLowerCase().replace(/\s+/g, '_'),
    second_opinion_verdict: String(verdict || 'unknown').slice(0, 80),
    second_opinion_input_mode: inputMode,
    second_opinion_extracted_from_image: extractedFromImage ? 'true' : 'false',
    ...buildAnalyticsContext({
      pageSurface: 'diagnostic',
      intentCluster: 'diagnostic',
    }),
  });
}

export function trackSecondOpinionLimitHit(checksUsed: number): void {
  trackEvent('second_opinion_limit_hit', {
    event_category: 'revenue_funnel',
    event_label: `checks_used_${Math.max(0, Number(checksUsed || 0))}`,
    checks_used: Math.max(0, Number(checksUsed || 0)),
    ...buildAnalyticsContext({
      pageSurface: 'diagnostic',
      intentCluster: 'diagnostic',
    }),
  });
}

// ─── CEL Landing Page Events ────────────────────────────────────────────────

export const Analytics = {
  celPageView: () => trackEvent('cel_landing_view', { event_category: 'landing' }),

  vehicleSelected: (make: string, model: string, year: string) =>
    trackEvent('vehicle_selected', { make, model, year }),

  symptomEntered: (symptom: string) =>
    trackEvent('symptom_entered', { symptom: symptom.slice(0, 100) }),

  diagnoseClicked: (vehicle: string, symptom: string) =>
    trackEvent('diagnostic_start', {
      vehicle,
      symptom: symptom.slice(0, 100),
      ...buildAnalyticsContext({
        ...parseVehicleLabel(vehicle),
        pageSurface: 'diagnostic',
        intentCluster: deriveIntentCluster({
          pageSurface: 'diagnostic',
          task: symptom,
          vehicle,
        }),
        vehicle,
      }),
    }),

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
