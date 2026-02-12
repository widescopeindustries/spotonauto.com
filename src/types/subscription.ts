export type SubscriptionTier = 'free' | 'pro' | 'pro_plus';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UsageLimits {
  aiDiagnosesPerMonth: number;
  guidesPerMonth: number;
  obdScansPerMonth: number;
  garageVehicles: number;
  pdfDownloads: boolean;
  prioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  free: {
    aiDiagnosesPerMonth: 3,
    guidesPerMonth: 5,
    obdScansPerMonth: 0,
    garageVehicles: 1,
    pdfDownloads: false,
    prioritySupport: false,
  },
  pro: {
    aiDiagnosesPerMonth: Infinity,
    guidesPerMonth: Infinity,
    obdScansPerMonth: Infinity,
    garageVehicles: 10,
    pdfDownloads: true,
    prioritySupport: true,
  },
  pro_plus: {
    aiDiagnosesPerMonth: Infinity,
    guidesPerMonth: Infinity,
    obdScansPerMonth: Infinity,
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
  obdScansUsed: number;
}
