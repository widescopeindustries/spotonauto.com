/**
 * Subscription Service - local-only tier bookkeeping for the self-hosted stack
 */

import { readLocalJson, writeLocalJson } from '@/lib/localBrowserStore';
import { Subscription, UserUsage } from '@/types/subscription';

const SUBSCRIPTION_KEY = 'spotonauto-subscription-v1';
const USAGE_KEY = 'spotonauto-usage-v1';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export class SubscriptionService {
  private userId: string;
  private cachedSubscription: Subscription | null = null;
  private cachedUsage: UserUsage | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getSubscription(): Promise<Subscription | null> {
    if (this.cachedSubscription) return this.cachedSubscription;

    const data = readLocalJson<Record<string, Subscription>>(SUBSCRIPTION_KEY, {});
    const subscription = data[this.userId] ?? null;
    this.cachedSubscription = subscription;
    return subscription;
  }

  async getUsage(): Promise<UserUsage | null> {
    if (this.cachedUsage) return this.cachedUsage;

    const data = readLocalJson<Record<string, UserUsage>>(USAGE_KEY, {});
    const usage = data[this.userId] ?? {
      userId: this.userId,
      month: currentMonth(),
      aiDiagnosesUsed: 0,
      guidesAccessed: 0,
    };
    this.cachedUsage = usage;
    return usage;
  }

  async canUseAiDiagnosis(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const usage = await this.getUsage();
    const limit = Infinity;
    return { allowed: true, remaining: limit, limit };
  }

  async canAddVehicle(): Promise<boolean> {
    return true;
  }

  async canDownloadPdf(): Promise<boolean> {
    return true;
  }

  async recordAiDiagnosis(): Promise<boolean> {
    const data = readLocalJson<Record<string, UserUsage>>(USAGE_KEY, {});
    const usage = data[this.userId] ?? {
      userId: this.userId,
      month: currentMonth(),
      aiDiagnosesUsed: 0,
      guidesAccessed: 0,
    };
    data[this.userId] = {
      ...usage,
      month: currentMonth(),
      aiDiagnosesUsed: usage.aiDiagnosesUsed + 1,
    };
    writeLocalJson(USAGE_KEY, data);
    this.cachedUsage = data[this.userId];
    return true;
  }

  async getFeatureComparison() {
    return {
      currentTier: 'free' as const,
      features: [
        { name: 'AI Diagnoses', free: 'Unlimited', pro: 'Unlimited', proPlus: 'Unlimited', current: 'Unlimited' },
        { name: 'Repair Guides', free: 'Unlimited', pro: 'Unlimited', proPlus: 'Unlimited', current: 'Unlimited' },
        { name: 'Garage Vehicles', free: 'Unlimited', pro: 'Unlimited', proPlus: 'Unlimited', current: 'Unlimited' },
        { name: 'PDF Downloads', free: '✓', pro: '✓', proPlus: '✓', current: '✓' },
        { name: 'Priority Support', free: '✓', pro: '✓', proPlus: '✓', current: '✓' },
      ],
    };
  }
}

export function useSubscription(userId: string) {
  return new SubscriptionService(userId);
}
