/**
 * GA4 Analytics Service
 * Handles event tracking and UTM parameter capture
 */

const GA4_MEASUREMENT_ID = 'G-WNFX6CY9RN';

/** Initialize GA4 gtag */
export function initGA4() {
  if (typeof window === 'undefined') return;
  if (document.getElementById('ga4-script')) return;

  // Load gtag.js
  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(arguments);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: false, // We'll send manually for SPA
  });

  // Capture UTM params on first load
  captureUTMParams();
}

/** Send a page view */
export function trackPageView(path: string, title?: string) {
  const gtag = (window as any).gtag;
  if (!gtag) return;

  const utmData = getUTMParams();
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    ...(utmData.utm_source && { campaign_source: utmData.utm_source }),
    ...(utmData.utm_medium && { campaign_medium: utmData.utm_medium }),
    ...(utmData.utm_campaign && { campaign_name: utmData.utm_campaign }),
  });
}

/** Track custom events */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  const gtag = (window as any).gtag;
  if (!gtag) return;

  const utmData = getUTMParams();
  gtag('event', eventName, {
    ...params,
    ...(utmData.utm_source && { campaign_source: utmData.utm_source }),
    ...(utmData.utm_medium && { campaign_medium: utmData.utm_medium }),
    ...(utmData.utm_campaign && { campaign_name: utmData.utm_campaign }),
  });
}

// ==================== UTM Capture ====================

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'spotonauto_utm';

/** Capture UTM params from URL and store in sessionStorage */
function captureUTMParams() {
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

  // Also capture gclid (Google Ads click ID)
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
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ==================== Predefined Events ====================

export const Analytics = {
  // Landing page events
  celPageView: () => trackPageView('/cel', 'Check Engine Light - Free AI Diagnosis'),

  // Funnel events
  vehicleSelected: (make: string, model: string, year: string) =>
    trackEvent('vehicle_selected', { make, model, year }),

  symptomEntered: (symptom: string) =>
    trackEvent('symptom_entered', { symptom: symptom.slice(0, 100) }),

  diagnoseClicked: (vehicle: { year: string; make: string; model: string }, symptom: string) =>
    trackEvent('diagnose_started', {
      vehicle_year: vehicle.year,
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      symptom: symptom.slice(0, 100),
    }),

  guideGenerated: (vehicle: { year: string; make: string; model: string }, task: string) =>
    trackEvent('guide_generated', {
      vehicle_year: vehicle.year,
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      task: task.slice(0, 100),
    }),

  // Conversion events
  signupStarted: () => trackEvent('sign_up_started'),
  signupCompleted: (method: string) => trackEvent('sign_up', { method }),
  upgradeClicked: () => trackEvent('upgrade_clicked'),
  purchaseCompleted: (value: number) =>
    trackEvent('purchase', { value, currency: 'USD' }),
};
