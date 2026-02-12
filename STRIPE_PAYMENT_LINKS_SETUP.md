# 💳 Stripe Payment Links Setup Guide

This is the **easiest way** to accept payments. No backend API code needed!

---

## 🎯 What Are Payment Links?

Stripe Payment Links are pre-built checkout pages that you can create in seconds. When users click "Subscribe", they go directly to Stripe's secure checkout page.

**Pros:**
- ✅ No backend API code needed
- ✅ Stripe handles all payment security
- ✅ Automatic invoice emails
- ✅ Built-in customer portal for managing subscriptions
- ✅ You can set up in 5 minutes

---

## 📋 Step-by-Step Setup

### Step 1: Create Products in Stripe

1. Go to https://dashboard.stripe.com/products
2. Click "+ Add product"
3. Create these 4 products:

#### Product 1: Pro Monthly
- **Name:** SpotOn Auto Pro
- **Description:** Unlimited AI diagnoses, OBD scanner, 10 vehicles
- **Pricing model:** Standard pricing
- **Price:** $9.99
- **Billing period:** Monthly

#### Product 2: Pro Annual
- **Name:** SpotOn Auto Pro (Annual)
- **Description:** Save 20% with annual billing
- **Pricing model:** Standard pricing
- **Price:** $95.90 (=$9.99 × 12 × 0.8)
- **Billing period:** Yearly

#### Product 3: Pro+ Monthly
- **Name:** SpotOn Auto Pro+
- **Description:** Live mechanic chat, video consultations, unlimited vehicles
- **Pricing model:** Standard pricing
- **Price:** $19.99
- **Billing period:** Monthly

#### Product 4: Pro+ Annual
- **Name:** SpotOn Auto Pro+ (Annual)
- **Description:** Save 20% with annual billing
- **Pricing model:** Standard pricing
- **Price:** $191.90 (=$19.99 × 12 × 0.8)
- **Billing period:** Yearly

---

### Step 2: Create Payment Links

1. Go to https://dashboard.stripe.com/payment-links
2. Click "+ Create"
3. For each product, create a payment link:

#### Creating Each Link:
1. Select "Products" 
2. Choose one of your products (Pro Monthly, Pro Annual, etc.)
3. Click "Next"
4. Configure these settings:

**Customer collection:** Email (required)

**Confirmation page:** 
- Show confirmation page
- Redirect to: `https://spotonauto.com/dashboard?success=true`

**Metadata (IMPORTANT!):**
- Add metadata key: `tier`
- Value: `pro` or `pro_plus` (depending on the product)

5. Click "Create link"
6. Copy the URL (looks like: `https://buy.stripe.com/xxxxx`)

---

### Step 3: Add URLs to Your Code

Create/update `.env.local`:

```env
# Stripe Payment Links
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK=https://buy.stripe.com/YOUR_PRO_MONTHLY_LINK_HERE
NEXT_PUBLIC_STRIPE_PRO_ANNUAL_LINK=https://buy.stripe.com/YOUR_PRO_ANNUAL_LINK_HERE
NEXT_PUBLIC_STRIPE_PRO_PLUS_MONTHLY_LINK=https://buy.stripe.com/YOUR_PRO_PLUS_MONTHLY_LINK_HERE
NEXT_PUBLIC_STRIPE_PRO_PLUS_ANNUAL_LINK=https://buy.stripe.com/YOUR_PRO_PLUS_ANNUAL_LINK_HERE

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (for webhooks - see below)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### Step 4: Setup Webhook (To Activate Subscriptions)

When someone pays via Payment Link, Stripe needs to tell your app to upgrade their account.

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://spotonauto.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Testing Your Setup

### Test Mode (Before Going Live)

1. In Stripe, toggle to "Test mode" (top right)
2. Create test payment links
3. Update `.env.local` with test links
4. Use test card: `4242 4242 4242 4242`
   - Any future date
   - Any 3-digit CVC
   - Any ZIP

### Live Mode

1. Toggle to "Live mode"
2. Recreate products and payment links
3. Update `.env.local` with live links
4. Redeploy

---

## 🔧 How It Works

```
User clicks "Start Pro Trial"
    ↓
Redirected to Stripe Payment Link
    ↓
User enters payment info on Stripe
    ↓
Payment successful
    ↓
Stripe redirects to: /dashboard?success=true
    ↓
Webhook fires: checkout.session.completed
    ↓
Your app updates user's tier to "pro"
    ↓
User has access to all Pro features!
```

---

## 🎨 Customizing Payment Links

### Add Your Branding

In Stripe Dashboard:
1. Settings → Branding
2. Upload your logo
3. Set brand color (I recommend: #00D4FF - neon cyan)
4. Add your business name

### Customize Checkout Page

For each Payment Link:
1. Click "Settings" on the link
2. Upload custom header image
3. Add terms of service URL
4. Collect phone number (optional)

---

## 📊 Managing Subscriptions

### View Customers
https://dashboard.stripe.com/customers

### View Subscriptions
https://dashboard.stripe.com/subscriptions

### Handle Refunds
1. Find payment in https://dashboard.stripe.com/payments
2. Click "Refund"

### Customer Portal (Let Users Manage Their Subscription)

Your users can:
- Update payment method
- Cancel subscription
- View billing history

The webhook I created automatically handles cancellations.

---

## 🚨 Common Issues

### "Payment link not found"
- Check that `.env.local` has correct URLs
- Make sure you redeployed after updating env vars
- Verify links are active in Stripe dashboard

### "Webhook not working"
- Check that `STRIPE_WEBHOOK_SECRET` is correct
- Verify endpoint URL is accessible
- Check Vercel logs for errors

### "User not upgraded after payment"
- Check webhook events in Stripe dashboard
- Look for failed webhook deliveries
- Verify Supabase connection

---

## 💡 Pro Tips

1. **Use Stripe's Customer Portal**
   - Go to Settings → Customer portal
   - Enable: "Allow customers to update payment methods"
   - Enable: "Allow customers to cancel subscriptions"

2. **Set Up Email Receipts**
   - Settings → Emails
   - Enable "Successful payments"
   - Customize email template

3. **Add Tax (if needed)**
   - Settings → Tax
   - Stripe can automatically calculate sales tax

4. **Offer Trials**
   - In product settings, add "Free trial"
   - Set to 7 or 14 days
   - User enters card but isn't charged until trial ends

---

## ✅ Quick Checklist

- [ ] Created 4 products in Stripe
- [ ] Created 4 payment links
- [ ] Added metadata `tier: pro` / `tier: pro_plus` to links
- [ ] Copied payment link URLs to `.env.local`
- [ ] Created webhook endpoint
- [ ] Added webhook secret to `.env.local`
- [ ] Tested with test card 4242 4242 4242 4242
- [ ] Deployed to production
- [ ] Switched to Live mode and recreated links

---

## 🆘 Need Help?

Stripe Support: https://support.stripe.com

Or ask me to:
- Debug your webhook
- Add trial periods
- Set up tax collection
- Create promotional codes

---

**You're 5 minutes away from accepting payments!** 🚀
