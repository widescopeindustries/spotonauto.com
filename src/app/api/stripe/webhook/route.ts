import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { creditCustomer, getOrCreateCustomerByStripeSession } from '@/lib/credits';

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('[stripe/webhook] signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const stripeCustomerId = session.customer;
    const email = session.customer_email || session.customer_details?.email;
    const metadata = session.metadata || {};
    const credits = parseInt(metadata.credits, 10);
    const packId = metadata.credit_pack_id || 'unknown';
    const sessionId = session.id;

    if (session.payment_status !== 'paid') {
      console.log('[stripe/webhook] checkout.session.completed but payment_status is', session.payment_status, sessionId);
      return NextResponse.json({ received: true, status: 'not_paid' }, { status: 200 });
    }

    if (!stripeCustomerId || !credits || isNaN(credits)) {
      console.error('[stripe/webhook] missing customer or credits', { session });
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    try {
      const customer = await getOrCreateCustomerByStripeSession(stripeCustomerId, email);
      await creditCustomer(customer.id, credits, {
        type: 'stripe_purchase',
        description: `Stripe purchase: ${packId} pack (${credits} credits)`,
        stripeSessionId: sessionId,
      });
      console.log(`[stripe/webhook] credited ${credits} credits to customer ${customer.id}`);
    } catch (err: any) {
      console.error('[stripe/webhook] failed to credit customer:', err);
      return NextResponse.json({ error: 'Failed to credit customer' }, { status: 500 });
    }
  }

  // Refunds and disputes: record the event for manual review. Automated credit
  // reversal requires matching the original pack metadata, which is not reliably
  // present on charge events; log and create an audit transaction instead.
  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    const charge = event.data.object as any;
    const stripeCustomerId = charge.customer;
    const eventId = event.id;
    const eventType = event.type;

    if (stripeCustomerId) {
      try {
        const customer = await getOrCreateCustomerByStripeSession(stripeCustomerId, null);
        await creditCustomer(customer.id, 0, {
          type: eventType === 'charge.refunded' ? 'refund' : 'dispute',
          description: `Stripe ${eventType} recorded for charge ${charge.id}. Manual review required.`,
          stripeSessionId: eventId,
        });
        console.log(`[stripe/webhook] recorded ${eventType} for customer ${customer.id}`);
      } catch (err: any) {
        console.error(`[stripe/webhook] failed to record ${eventType}:`, err);
      }
    } else {
      console.warn(`[stripe/webhook] ${eventType} without customer id`, { charge });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
