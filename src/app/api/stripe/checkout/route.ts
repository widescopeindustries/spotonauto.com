import { NextRequest, NextResponse } from 'next/server';
import { stripe, getCreditPack, getPriceId, isStripeConfigured } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured on this server.' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const packId = searchParams.get('pack') || 'starter';
  const email = searchParams.get('email') || undefined;
  const pack = getCreditPack(packId);
  const priceId = getPriceId(pack.id);

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for pack: ${pack.id}` },
      { status: 500 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `https://alloemmanuals.com/api/account?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://alloemmanuals.com/api/account?canceled=1`,
      metadata: {
        credit_pack_id: pack.id,
        credits: String(pack.credits),
        price_cents: String(pack.priceCents),
      },
    });

    return NextResponse.json(
      {
        url: session.url,
        pack: {
          id: pack.id,
          name: pack.name,
          price_cents: pack.priceCents,
          credits: pack.credits,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[stripe/checkout] error:', err);
    return NextResponse.json(
      { error: 'Failed to create Stripe checkout session.', message: err.message },
      { status: 500 }
    );
  }
}
