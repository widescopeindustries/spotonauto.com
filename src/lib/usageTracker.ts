// Lightweight usage tracking for free tier limits
// Uses localStorage for anonymous users, can be upgraded to Supabase for logged-in users

const STORAGE_KEY = 'spoton_usage';
const LIMITS = { diagnoses: 3, guides: 1 };

interface UsageData {
  month: string; // "2026-02" format
  diagnoses: number;
  guides: number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsage(): UsageData {
  if (typeof window === 'undefined') return { month: getCurrentMonth(), diagnoses: 0, guides: 0 };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { month: getCurrentMonth(), diagnoses: 0, guides: 0 };
    const data: UsageData = JSON.parse(raw);
    // Reset if new month
    if (data.month !== getCurrentMonth()) {
      return { month: getCurrentMonth(), diagnoses: 0, guides: 0 };
    }
    return data;
  } catch {
    return { month: getCurrentMonth(), diagnoses: 0, guides: 0 };
  }
}

function saveUsage(data: UsageData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function trackDiagnosisUse(): { allowed: boolean; used: number; limit: number } {
  const usage = getUsage();
  const allowed = usage.diagnoses < LIMITS.diagnoses;
  if (allowed) {
    usage.diagnoses++;
    saveUsage(usage);
  }
  return { allowed, used: usage.diagnoses, limit: LIMITS.diagnoses };
}

export function trackGuideUse(): { allowed: boolean; used: number; limit: number } {
  const usage = getUsage();
  const allowed = usage.guides < LIMITS.guides;
  if (allowed) {
    usage.guides++;
    saveUsage(usage);
  }
  return { allowed, used: usage.guides, limit: LIMITS.guides };
}

export function getUsageStatus(): { diagnoses: { used: number; limit: number }; guides: { used: number; limit: number } } {
  const usage = getUsage();
  return {
    diagnoses: { used: usage.diagnoses, limit: LIMITS.diagnoses },
    guides: { used: usage.guides, limit: LIMITS.guides },
  };
}

export function isProUser(): boolean {
  // Check localStorage for pro status (set by Stripe webhook or auth flow)
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('spoton_pro') === 'true';
}

/**
 * Returns true if the user has already used their one free guide this month.
 * Used to determine if subsequent guides should show blurred premium content.
 */
export function isFirstFreeGuideUsed(): boolean {
  const usage = getUsage();
  return usage.guides >= 1;
}

/**
 * Peek at current guide usage without incrementing.
 * Returns true if user can generate a full (non-gated) guide.
 */
export function canAccessFullGuide(): boolean {
  const usage = getUsage();
  return usage.guides < LIMITS.guides;
}
