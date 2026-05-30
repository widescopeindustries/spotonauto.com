# DNS Records to Add at NameCheap (RIGHT NOW)

Tollbit has approved your application and needs domain verification.
**Add these 5 DNS records at NameCheap immediately.**

---

## Step-by-Step: NameCheap DNS

1. Go to https://namecheap.com and log in
2. **Domain List** → find `alloemmanuals.com` → click **Manage**
3. Click the **Advanced DNS** tab
4. In **Host Records**, add these records one by one:

### Record 1: TXT Verification (CRITICAL)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT Record | `@` | `tollbit-domain-verification=13b8392154d736a61564482ca408a5e5660fcc2202d737a0c7dad98ac5b1ebd2` | Automatic |

### Records 2–5: NS Records for Tollbit Subdomain

| Type | Host | Value | TTL |
|------|------|-------|-----|
| NS Record | `tollbit` | `ns1.edge.tollbit.com` | Automatic |
| NS Record | `tollbit` | `ns2.edge.tollbit.com` | Automatic |
| NS Record | `tollbit` | `ns3.edge.tollbit.com` | Automatic |
| NS Record | `tollbit` | `ns4.edge.tollbit.com` | Automatic |

5. Click the **green checkmark** after each record to save
6. Wait 5–10 minutes

---

## How to Verify It Worked

Open a terminal and run:

```bash
# Check TXT record
dig TXT alloemmanuals.com +short

# Should output something containing:
# "tollbit-domain-verification=13b8392154d736a61564482ca408a5e5660fcc2202d737a0c7dad98ac5b1ebd2"
```

```bash
# Check NS records for tollbit subdomain
dig NS tollbit.alloemmanuals.com +short

# Should output:
# ns1.edge.tollbit.com
# ns2.edge.tollbit.com
# ns3.edge.tollbit.com
# ns4.edge.tollbit.com
```

---

## Important Notes

- **Do NOT change your main nameservers yet.** Keep using NameCheap's default (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`) for now.
- Only the `tollbit` subdomain gets NS records pointing to Tollbit. Your main domain stays on NameCheap.
- Cloudflare is **not needed for this step.** We can add Cloudflare later for the Worker if you want, but Tollbit works fine with just NameCheap DNS.

---

## After You Add the Records

1. Go back to Tollbit dashboard
2. Click **"Retry Step"** or **"Verify Property"**
3. It may take 5–30 minutes to verify
4. Once verified, Tollbit will let you set rates and view analytics

Reply with "Done" once you've added the records and clicked verify.
