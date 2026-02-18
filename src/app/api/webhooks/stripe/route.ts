import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Check both metadata keys for compatibility with checkout sessions and payment links
  const userId = session.metadata?.userId || session.metadata?.supabaseUserId;
  
  // For Payment Links: look up user by customer email if no metadata
  if (!userId) {
    const customerEmail = session.customer_details?.email || session.customer_email;
    if (!customerEmail) {
      console.error('No userId in metadata and no customer email found');
      return;
    }
    
    // Look up user by email in Supabase auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const matchedUser = users?.users?.find(u => u.email === customerEmail);
    if (!matchedUser) {
      console.error(`No Supabase user found for email: ${customerEmail}`);
      return;
    }
    
    // Continue with the matched user
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscription.items.data[0].price.id;
    const tier = getTierFromPriceId(priceId);
    
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: matchedUser.id,
        tier,
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' });
    
    console.log(`Subscription activated for ${customerEmail} (${matchedUser.id}): ${tier}`);
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Determine tier based on price
  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  // Upsert subscription in database (handles both new and existing users)
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: 'user_id' });

  console.log(`✅ Subscription activated for user ${userId}: ${tier}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Find user by subscription ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  // Update period dates
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
  
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`✅ Invoice paid for subscription ${subscriptionId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!sub) return;

  // Check if canceled
  const status = subscription.cancel_at_period_end ? 'canceled' : 
                 subscription.status === 'active' ? 'active' : 'past_due';

  // Check if tier changed
  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  await supabase
    .from('subscriptions')
    .update({
      tier,
      status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`📝 Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`❌ Subscription canceled: ${subscription.id}`);
}

function getTierFromPriceId(priceId: string): 'pro' | 'pro_plus' {
  // Map your Stripe price IDs to tiers
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const proPlusPriceId = process.env.STRIPE_PRO_PLUS_PRICE_ID;

  if (priceId === proPlusPriceId) return 'pro_plus';
  return 'pro';
}
