/**
 * GA4 Analytics Service
 * Centralized event tracking + UTM parameter capture for SpotOnAuto
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'spotonauto_utm';

/** Safe gtag wrapper */
function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

/** Track custom events with automatic UTM attribution */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  const utmData = getUTMParams();
  gtag('event', eventName, {
    ...params,
    ...(utmData.utm_source && { campaign_source: utmData.utm_source }),
    ...(utmData.utm_medium && { campaign_medium: utmData.utm_medium }),
    ...(utmData.utm_campaign && { campaign_name: utmData.utm_campaign }),
  });
}

// ==================== UTM Capture ====================

/** Capture UTM params from URL and persist in sessionStorage */
export function captureUTMParams() {
  if (typeof window === 'undefined') return;

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
export function getUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ==================== Predefined Events ====================

export const Analytics = {
  // Landing page
  celPageView: () => trackEvent('cel_landing_view', { event_category: 'landing' }),

  // Funnel
  vehicleSelected: (make: string, model: string, year: string) =>
    trackEvent('vehicle_selected', { make, model, year }),

  symptomEntered: (symptom: string) =>
    trackEvent('symptom_entered', { symptom: symptom.slice(0, 100) }),

  diagnoseClicked: (vehicle: string, symptom: string) =>
    trackEvent('diagnose_started', { vehicle, symptom: symptom.slice(0, 100) }),

  guideGenerated: (vehicle: string, task: string) =>
    trackEvent('guide_generated', { vehicle, task: task.slice(0, 100) }),

  // Conversion
  signupStarted: () => trackEvent('sign_up_started'),
  signupCompleted: (method: string) => trackEvent('sign_up', { method }),
  upgradeClicked: () => trackEvent('upgrade_clicked'),
  purchaseCompleted: (value: number) =>
    trackEvent('purchase', { value, currency: 'USD' }),
};

// Type declaration for window.gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
