// Analytics utility for tracking affiliate clicks and conversions

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export type AffiliateProvider = 'Amazon';

interface AffiliateClickEvent {
  provider: AffiliateProvider;
  partName: string;
  vehicle: string;
  isHighTicket: boolean;
  pageType: 'repair_guide' | 'parts_page' | 'diagnostic';
}

interface GuideGeneratedEvent {
  vehicle: string;
  task: string;
  partsCount: number;
  toolsCount: number;
}

/**
 * Track when a user clicks an affiliate link
 */
export function trackAffiliateClick(event: AffiliateClickEvent): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'affiliate_click', {
      event_category: 'affiliate',
      event_label: `${event.provider}_${event.partName}`,
      provider: event.provider,
      part_name: event.partName,
      vehicle: event.vehicle,
      is_high_ticket: event.isHighTicket,
      page_type: event.pageType,
      value: event.isHighTicket ? 10 : 1, // Weight high-ticket items
    });
  }

  // Also log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Affiliate click:', event);
  }
}

/**
 * Track when a repair guide is generated
 */
export function trackGuideGenerated(event: GuideGeneratedEvent): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'guide_generated', {
      event_category: 'engagement',
      event_label: `${event.vehicle}_${event.task}`,
      vehicle: event.vehicle,
      task: event.task,
      parts_count: event.partsCount,
      tools_count: event.toolsCount,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Guide generated:', event);
  }
}

/**
 * Track page views for specific repair guides (for SEO tracking)
 */
export function trackRepairPageView(vehicle: string, task: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'repair_page_view', {
      event_category: 'engagement',
      event_label: `${vehicle}_${task}`,
      vehicle,
      task,
    });
  }
}

/**
 * Track diagnostic session start
 */
export function trackDiagnosticStart(vehicle: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'diagnostic_start', {
      event_category: 'engagement',
      event_label: vehicle,
      vehicle,
    });
  }
}

/**
 * Track "Shop All" clicks (higher intent)
 */
export function trackShopAllClick(provider: AffiliateProvider, vehicle: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'shop_all_click', {
      event_category: 'affiliate',
      event_label: provider,
      provider,
      vehicle,
      value: 5, // Higher value for shop-all intent
    });
  }
}
