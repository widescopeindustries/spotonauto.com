import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { extractBearerToken, maskApiKey } from '@/lib/apiKey';
import {
  getCustomerByApiKey,
  getCustomerByStripeSessionId,
  rotateApiKey,
  getTransactionHistory,
  getOrCreateCustomerByStripeSession,
  creditCustomer,
  retrieveApiKeyForDisplay,
  getLocalPool,
} from '@/lib/credits';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const canceled = searchParams.get('canceled') === '1';
  const apiKey = extractBearerToken(request);

  // If returning from Stripe checkout, eagerly credit via session lookup
  if (sessionId && isStripeConfigured() && stripe) {
    let customer = null;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        const stripeCustomerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id || null;
        const email = session.customer_email || session.customer_details?.email;
        const metadata = session.metadata || {};
        const credits = parseInt(metadata.credits, 10);
        const packId = metadata.credit_pack_id || 'unknown';

        if (stripeCustomerId) {
          customer = await getOrCreateCustomerByStripeSession(stripeCustomerId, email);
          // Only credit if not already credited; webhook is the normal flow.
          const txns = await getTransactionHistory(customer.id, 10);
          const alreadyCredited = txns.some(
            (t) => t.stripe_session_id === sessionId && t.type === 'stripe_purchase'
          );
          if (!alreadyCredited && credits && !isNaN(credits)) {
            await creditCustomer(customer.id, credits, {
              type: 'stripe_purchase',
              description: `Stripe purchase (return): ${packId} pack (${credits} credits)`,
              stripeSessionId: sessionId,
            });
          }
        } else {
          // Synthetic/manual sessions may not have a Stripe customer object;
          // look up the customer we already credited via webhook.
          customer = await getCustomerByStripeSessionId(sessionId);
        }

        if (customer) {
          // Plaintext key is shown once after checkout, then cleared from the DB.
          const displayKey = await retrieveApiKeyForDisplay(customer.id);
          return NextResponse.json(
            {
              success: true,
              api_key: displayKey,
              api_key_masked: maskApiKey(displayKey || ''),
              balance_cents: customer.balance_cents,
              balance_usd: (customer.balance_cents / 100).toFixed(2),
              customer_id: customer.id,
              email: customer.email,
              message: displayKey
                ? 'Save this API key — it will not be shown again.'
                : 'API key was already displayed. Use key rotation if you lost it.',
            },
            { status: 200 }
          );
        }
      } else {
        // Session is not showing as paid (e.g. synthetic test event), but webhook may have credited it.
        customer = await getCustomerByStripeSessionId(sessionId);
        if (customer) {
          return NextResponse.json(
            {
              success: true,
              api_key_masked: maskApiKey(customer.api_key || ''),
              balance_cents: customer.balance_cents,
              balance_usd: (customer.balance_cents / 100).toFixed(2),
              customer_id: customer.id,
              email: customer.email,
            },
            { status: 200 }
          );
        }
      }
    } catch (err: any) {
      console.error('[account] session retrieval failed:', err);
      // As a last resort, try to find the customer by session_id in transactions.
      customer = await getCustomerByStripeSessionId(sessionId);
      if (customer) {
        return NextResponse.json(
          {
            success: true,
            api_key_masked: maskApiKey(customer.api_key || ''),
            balance_cents: customer.balance_cents,
            balance_usd: (customer.balance_cents / 100).toFixed(2),
            customer_id: customer.id,
            email: customer.email,
          },
          { status: 200 }
        );
      }
    }
  }

  if (canceled) {
    return NextResponse.json({ success: false, message: 'Checkout canceled.' }, { status: 200 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Authentication required. Provide Bearer API key or complete a Stripe checkout.' },
      { status: 401 }
    );
  }

  const customer = await getCustomerByApiKey(apiKey);
  if (!customer) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
  }

  const transactions = await getTransactionHistory(customer.id, 50);

  return NextResponse.json(
    {
      customer_id: customer.id,
      email: customer.email,
      balance_cents: customer.balance_cents,
      balance_usd: (customer.balance_cents / 100).toFixed(2),
      api_key_masked: maskApiKey(customer.api_key || ''),
      transactions: transactions.map((t) => ({
        type: t.type,
        amount_cents: t.amount_cents,
        balance_after_cents: t.balance_after_cents,
        description: t.description,
        created_at: t.created_at,
      })),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const apiKey = extractBearerToken(request);
  if (!apiKey) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const customer = await getCustomerByApiKey(apiKey);
  if (!customer) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === 'rotate_key') {
    const updated = await rotateApiKey(customer.id);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to rotate key.' }, { status: 500 });
    }
    const displayKey = await retrieveApiKeyForDisplay(updated.id);
    return NextResponse.json(
      {
        success: true,
        api_key: displayKey,
        api_key_masked: maskApiKey(displayKey || ''),
        message: displayKey
          ? 'API key rotated. Save this new key — it will not be shown again.'
          : 'API key rotated.',
      },
      { status: 200 }
    );
  }

  if (body.email && !customer.email) {
    const pool = getLocalPool();
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Make sure the email is not already owned by another customer.
      const existing = await client.query(
        'SELECT id FROM api_customers WHERE email = LOWER($1) AND id <> $2 FOR UPDATE',
        [body.email, customer.id]
      );
      if (existing.rows[0]) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Email already associated with another account.' },
          { status: 409 }
        );
      }

      const updated = await client.query(
        'UPDATE api_customers SET email = LOWER($1), updated_at = now() WHERE id = $2 RETURNING email',
        [body.email, customer.id]
      );

      await client.query('COMMIT');
      return NextResponse.json(
        {
          success: true,
          email: updated.rows[0]?.email,
          message: 'Email updated.',
        },
        { status: 200 }
      );
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
