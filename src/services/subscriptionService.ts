/**
 * Subscription Service - Handles tier checks, usage tracking, and limits
 */

import { supabase } from './storageService';
import { Subscription, UserUsage, TIER_LIMITS, SubscriptionTier } from '@/types/subscription';

export class SubscriptionService {
  private userId: string;
  private cachedSubscription: Subscription | null = null;
  private cachedUsage: UserUsage | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get user's current subscription
   */
  async getSubscription(): Promise<Subscription | null> {
    if (this.cachedSubscription) return this.cachedSubscription;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    this.cachedSubscription = data;
    return data;
  }

  /**
   * Get user's current usage for this month
   */
  async getUsage(): Promise<UserUsage | null> {
    if (this.cachedUsage) return this.cachedUsage;

    const { data, error } = await supabase
      .rpc('get_or_create_usage', { p_user_id: this.userId });

    if (error) {
      console.error('Error fetching usage:', error);
      return null;
    }

    this.cachedUsage = data;
    return data;
  }

  /**
   * Check if user can perform AI diagnosis
   */
  async canUseAiDiagnosis(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const [subscription, usage] = await Promise.all([
      this.getSubscription(),
      this.getUsage()
    ]);

    if (!subscription || !usage) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    const tier = subscription.tier as SubscriptionTier;
    const limit = TIER_LIMITS[tier].aiDiagnosesPerMonth;
    const used = usage.ai_diagnoses_used;
    const remaining = limit === Infinity ? 999 : Math.max(0, limit - used);

    return {
      allowed: used < limit,
      remaining,
      limit: limit === Infinity ? 999 : limit
    };
  }

  /**
   * Check if user can add vehicle to garage
   */
  async canAddVehicle(currentVehicleCount: number): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;

    const tier = subscription.tier as SubscriptionTier;
    const limit = TIER_LIMITS[tier].garageVehicles;
    
    return limit === Infinity || currentVehicleCount < limit;
  }

  /**
   * Check if user can use OBD scanner
   */
  async canUseOBD(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;

    const tier = subscription.tier as SubscriptionTier;
    return TIER_LIMITS[tier].obdScansPerMonth > 0;
  }

  /**
   * Check if user can download PDF
   */
  async canDownloadPdf(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;

    const tier = subscription.tier as SubscriptionTier;
    return TIER_LIMITS[tier].pdfDownloads;
  }

  /**
   * Record AI diagnosis usage
   */
  async recordAiDiagnosis(): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('increment_ai_diagnosis', { p_user_id: this.userId });

    if (error) {
      console.error('Error recording diagnosis:', error);
      return false;
    }

    // Clear cache
    this.cachedUsage = null;
    return data;
  }

  /**
   * Get feature comparison for UI
   */
  async getFeatureComparison() {
    const subscription = await this.getSubscription();
    const tier = (subscription?.tier || 'free') as SubscriptionTier;
    const usage = await this.getUsage();

    return {
      currentTier: tier,
      features: [
        {
          name: 'AI Diagnoses',
          free: '3/month',
          pro: 'Unlimited',
          proPlus: 'Unlimited',
          current: tier === 'free' 
            ? `${usage?.ai_diagnoses_used || 0}/3 used`
            : 'Unlimited'
        },
        {
          name: 'Repair Guides',
          free: '5/month',
          pro: 'Unlimited',
          proPlus: 'Unlimited',
          current: tier === 'free' ? '5/month' : 'Unlimited'
        },
        {
          name: 'Garage Vehicles',
          free: '1 vehicle',
          pro: '10 vehicles',
          proPlus: 'Unlimited',
          current: `${TIER_LIMITS[tier].garageVehicles} vehicles`
        },
        {
          name: 'OBD-II Scanner',
          free: '—',
          pro: '✓',
          proPlus: '✓',
          current: TIER_LIMITS[tier].obdScansPerMonth > 0 ? '✓' : '—'
        },
        {
          name: 'PDF Downloads',
          free: '—',
          pro: '✓',
          proPlus: '✓',
          current: TIER_LIMITS[tier].pdfDownloads ? '✓' : '—'
        },
        {
          name: 'Priority Support',
          free: '—',
          pro: '✓',
          proPlus: '✓',
          current: TIER_LIMITS[tier].prioritySupport ? '✓' : '—'
        }
      ]
    };
  }
}

// Hook for React components
export function useSubscription(userId: string) {
  return new SubscriptionService(userId);
}
