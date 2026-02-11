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
      value: 5,
    });
  }
}

/**
 * Track vehicle search submission from the dashboard
 */
export function trackVehicleSearch(vehicle: string, task: string, method: 'guide' | 'diagnose'): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'vehicle_search', {
      event_category: 'engagement',
      event_label: `${vehicle}_${task}`,
      vehicle,
      task,
      search_method: method,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Vehicle search:', { vehicle, task, method });
  }
}

/**
 * Track VIN decode attempts
 */
export function trackVinDecode(vin: string, success: boolean): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'vin_decode', {
      event_category: 'engagement',
      event_label: success ? 'success' : 'failure',
      success,
    });
  }
}

/**
 * Track when the upgrade modal is shown
 */
export function trackUpgradeModalShown(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'upgrade_modal_shown', {
      event_category: 'monetization',
      event_label: 'paywall_hit',
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Upgrade modal shown');
  }
}

/**
 * Track upgrade button click (Stripe checkout initiated)
 */
export function trackUpgradeClick(isLoggedIn: boolean): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      event_category: 'monetization',
      event_label: isLoggedIn ? 'checkout_started' : 'auth_redirect',
      currency: 'USD',
      value: 9.99,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Upgrade click, logged in:', isLoggedIn);
  }
}

/**
 * Track tool affiliate link clicks from repair guides
 */
export function trackToolClick(toolName: string, vehicle: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'tool_affiliate_click', {
      event_category: 'affiliate',
      event_label: toolName,
      tool_name: toolName,
      vehicle,
      value: 2,
    });
  }
}

/**
 * Track user sign-up or login
 */
export function trackAuth(method: 'google' | 'email', action: 'login' | 'signup'): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action === 'signup' ? 'sign_up' : 'login', {
      method,
    });
  }
}
