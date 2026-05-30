# Tollbit Setup Kit for alloemmanuals.com

**Status:** Broken redirects DISABLED. AI bots now see your normal site (no more DNS failures).

**What this kit does:** Everything is prepared. You only need to create 2 accounts and copy/paste 3 things.

---

## What Went Wrong Before

| Problem | Why It Happened |
|---------|-----------------|
| `tollbit.alloemmanuals.com` had no DNS record | NameCheap DNS was never updated with the CNAME |
| Cloudflare Worker wasn't deployed | Account existed but worker was never published to the domain |
| Next.js middleware was redirecting to broken subdomain | Code was correct but the subdomain didn't resolve |
| Tollbit crawler (tollbot) was eating bandwidth | It indexed your content but paying customers couldn't access it |

---

## The 3 Things YOU Need to Do (15 minutes total)

### 1. Create Cloudflare Account (5 min)
- Go to https://dash.cloudflare.com/sign-up
- Use email: `info@widescopeindustries.com` (or whatever you prefer)
- **Add site:** `alloemmanuals.com`
- Cloudflare will scan your DNS records — approve them all
- Change nameservers at NameCheap to the ones Cloudflare gives you (takes 5–30 min)

### 2. Apply to Tollbit (5 min)
- Go to https://tollbit.com
- Click "Publishers" → "Get Started" or "Apply"
- Use the application text in `tollbit-application.md` (copy/paste)
- They'll email you within 24–48 hours with your CNAME target and secret key

### 3. Add DNS Record at NameCheap (2 min)
- Log into NameCheap → Domain List → Manage → Advanced DNS
- Add the record from `dns-instructions.md`
- Wait 5 minutes, test with: `dig tollbit.alloemmanuals.com`

---

## What I Will Do Once You Give Me 2 Pieces of Info

After you get approved by Tollbit, they'll send you:
1. **CNAME target** (e.g., `cname.tollbit.io`)
2. **Secret key**

**Reply to me with those two things and I will:**
- Deploy the Cloudflare Worker (the bot redirect code)
- Re-enable the nginx redirect
- Re-enable the Next.js middleware redirect
- Test the full pipeline end-to-end
- Set your rates on Tollbit's dashboard

**You won't touch another config file.**

---

## Files in This Kit

| File | Purpose |
|------|---------|
| `README.md` | This file — the master guide |
| `cloudflare-worker.js` | Ready-to-deploy worker code (I deploy this for you) |
| `tollbit-application.md` | Copy/paste application with your volume data |
| `dns-instructions.md` | Exact DNS record to add at NameCheap |
| `nginx-re-enable.sh` | Script I run to turn redirects back on |

---

## Current Status

✅ **Broken redirects STOPPED** — AI bots see normal site  
⏳ **Cloudflare account** — you create this  
⏳ **Tollbit account** — you apply, they approve  
⏳ **DNS record** — you add this at NameCheap  
⏳ **Worker deployment** — I do this when you give me CNAME + key  
⏳ **Re-enable redirects** — I do this after worker is live  

---

## Revenue Potential (Real Numbers)

From your Tollbit dashboard screenshot:
- **Meta webindexer:** 2.0K scrapes, 71.6% of AI traffic
- **DuckAssistBot:** 670 scrapes, 24.3% of AI traffic
- **Claude-SearchBot:** 89 scrapes, 3.2% of AI traffic
- **Your site ranks 75th–84th percentile** for AI bot scraping

At **$0.005/page** (fair rate for proprietary factory data):
- ~2,800 scrapes/day = **$14/day = $420/month**
- With 270K spikes = **$1,350/day during peak windows**

At **$0.01/page** (premium technical data):
- ~2,800 scrapes/day = **$28/day = $840/month**
- With 270K spikes = **$2,700/day during peak windows**

This is real money that was going to `/dev/null`.

---

## Questions?

Just reply with:
- "I created the Cloudflare account" → I'll help with nameserver switch
- "I applied to Tollbit" → We wait for approval
- "I have the CNAME and key" → I do everything else
- "I'm stuck on step X" → I'll walk you through it
