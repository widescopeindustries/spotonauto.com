# DNS Instructions for NameCheap

## What You Need to Add

Once Tollbit approves your account, they will send you a **CNAME target**.
It will look something like: `cname.tollbit.io` or `alloemmanuals.tollbit.com`

**Replace `CNAME_TARGET_FROM_TOLLBIT` below with the actual value they give you.**

---

## Step-by-Step (NameCheap)

1. Log into https://namecheap.com
2. Go to **Domain List** → find `alloemmanuals.com` → click **Manage**
3. Click the **Advanced DNS** tab
4. In the **Host Records** section, click **Add New Record**
5. Fill in:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME Record | `tollbit` | `CNAME_TARGET_FROM_TOLLBIT` | Automatic |

**Example (replace with your actual Tollbit CNAME):**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME Record | `tollbit` | `cname.tollbit.io` | Automatic |

6. Click the green checkmark to save
7. Wait 5–30 minutes for propagation

---

## How to Test

Open a terminal and run:

```bash
dig tollbit.alloemmanuals.com +short
```

**Expected result:** It should return the Tollbit CNAME target (NOT blank).

```bash
curl -sI https://tollbit.alloemmanuals.com/
```

**Expected result:** HTTP 200 or 402 (NOT NXDOMAIN or connection refused).

---

## Important: Cloudflare Nameservers

If you switch to Cloudflare (recommended for the Worker), you will manage DNS in Cloudflare instead of NameCheap.

**After switching to Cloudflare nameservers:**
1. Log into https://dash.cloudflare.com
2. Select `alloemmanuals.com`
3. Go to **DNS** → **Records**
4. Click **Add Record**
5. Type: CNAME, Name: `tollbit`, Target: `[Tollbit's CNAME]`, Proxy: DNS only (gray cloud)
6. Save

**Do NOT orange-cloud (proxy) the Tollbit CNAME.** It must be DNS-only so Tollbit handles the SSL.

---

## What I Need From You

Reply to me with:
1. The exact CNAME target Tollbit gave you
2. Whether you're using NameCheap DNS or Cloudflare DNS

Then I update these instructions with the exact values and verify everything works.
