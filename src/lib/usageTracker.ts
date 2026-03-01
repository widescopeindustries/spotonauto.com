// Usage tracking — everything is free and unlimited

export function trackDiagnosisUse(): { allowed: boolean; used: number; limit: number } {
  return { allowed: true, used: 0, limit: Infinity };
}

export function trackGuideUse(): { allowed: boolean; used: number; limit: number } {
  return { allowed: true, used: 0, limit: Infinity };
}

export function getUsageStatus(): { diagnoses: { used: number; limit: number }; guides: { used: number; limit: number } } {
  return {
    diagnoses: { used: 0, limit: Infinity },
    guides: { used: 0, limit: Infinity },
  };
}

export function isProUser(): boolean {
  return true;
}

export function isFirstFreeGuideUsed(): boolean {
  return false;
}

export function canAccessFullGuide(): boolean {
  return true;
}
