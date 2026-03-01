/**
 * Subscription Service - Everything is free and unlimited
 */

import { supabase } from '@/lib/supabaseClient';
import { Subscription, UserUsage } from '@/types/subscription';

export class SubscriptionService {
  private userId: string;
  private cachedSubscription: Subscription | null = null;
  private cachedUsage: UserUsage | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

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

  async canUseAiDiagnosis(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    return { allowed: true, remaining: 999, limit: 999 };
  }

  async canAddVehicle(): Promise<boolean> {
    return true;
  }

  async canDownloadPdf(): Promise<boolean> {
    return true;
  }

  async recordAiDiagnosis(): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('increment_ai_diagnosis', { p_user_id: this.userId });

    if (error) {
      console.error('Error recording diagnosis:', error);
      return false;
    }

    this.cachedUsage = null;
    return data;
  }

  async getFeatureComparison() {
    return {
      currentTier: 'free' as const,
      features: [
        {
          name: 'AI Diagnoses',
          free: 'Unlimited',
          pro: 'Unlimited',
          proPlus: 'Unlimited',
          current: 'Unlimited'
        },
        {
          name: 'Repair Guides',
          free: 'Unlimited',
          pro: 'Unlimited',
          proPlus: 'Unlimited',
          current: 'Unlimited'
        },
        {
          name: 'Garage Vehicles',
          free: 'Unlimited',
          pro: 'Unlimited',
          proPlus: 'Unlimited',
          current: 'Unlimited'
        },
        {
          name: 'PDF Downloads',
          free: '✓',
          pro: '✓',
          proPlus: '✓',
          current: '✓'
        },
        {
          name: 'Priority Support',
          free: '✓',
          pro: '✓',
          proPlus: '✓',
          current: '✓'
        }
      ]
    };
  }
}

export function useSubscription(userId: string) {
  return new SubscriptionService(userId);
}
