
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-01-27.acacia' as any, // Cast to any to avoid strict version mismatch if types are outdated
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { email, userId } = req.body;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'ai auto repair pro',
                            description: 'Access to unlimited on demand repair guides and unlimited diagnostic flow charts',
                        },
                        unit_amount: 1099, // $10.99
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin}/?upgraded=true`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
            customer_email: email, // Pre-fill email
            metadata: {
                userId: userId, // Pass Supabase User ID to webhook
            },
            allow_promotion_codes: true,
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error('Stripe Error:', err);
        return res.status(500).json({ statusCode: 500, message: err.message });
    }
}
