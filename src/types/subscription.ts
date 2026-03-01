export type SubscriptionTier = 'free' | 'pro' | 'pro_plus';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageLimits {
  aiDiagnosesPerMonth: number;
  guidesPerMonth: number;
  garageVehicles: number;
  pdfDownloads: boolean;
  prioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  free: {
    aiDiagnosesPerMonth: Infinity,
    guidesPerMonth: Infinity,
    garageVehicles: Infinity,
    pdfDownloads: true,
    prioritySupport: true,
  },
  pro: {
    aiDiagnosesPerMonth: Infinity,
    guidesPerMonth: Infinity,
    garageVehicles: Infinity,
    pdfDownloads: true,
    prioritySupport: true,
  },
  pro_plus: {
    aiDiagnosesPerMonth: Infinity,
    guidesPerMonth: Infinity,
    garageVehicles: Infinity,
    pdfDownloads: true,
    prioritySupport: true,
  },
};

export interface UserUsage {
  userId: string;
  month: string; // YYYY-MM format
  aiDiagnosesUsed: number;
  guidesAccessed: number;
}
