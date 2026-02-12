# SpotOnAuto SEO Issues - Summary & Action Plan

**Generated:** 2026-02-08  
**Source:** Screaming Frog Audit

---

## 🚨 CRITICAL ISSUES

### 1. **498 Orphan Repair Pages** (Error)
**Problem:** All programmatic repair guide pages have **ZERO** incoming internal links.

**Example URLs:**
- `/repair/1987/toyota/camry/alternator-replacement`
- `/repair/2002/toyota/camry/battery-replacement`
- `/repair/1998/toyota/camry/oil-change`

**Impact:** 
- Google cannot discover these pages organically
- Pages rely 100% on sitemap submission
- Massive waste of content investment
- Poor internal link equity distribution

**Root Cause:** The repair guides are only accessible via:
1. Direct navigation from homepage form submit
2. Sitemap (which search engines may deprioritize)

**PRIORITY:** 🔴 **CRITICAL - FIX IMMEDIATELY**

---

### 2. **Non-Canonical Page in Sitemap** (Error)
**URL:** `https://spotonauto.com/diagnose`  
**Issue:** Page canonicalizes to `https://spotonauto.com/` but is listed in sitemap

**Impact:** Confuses search engines about which page to index

**Fix:** Remove `/diagnose` from sitemap OR remove canonical tag

---

## ⚠️ WARNINGS

### 3. **Open Graph Tags Incomplete** (233,463 instances)
Many pages missing complete OG tags (image, description, etc.)

### 4. **Title Too Long** (28,909 pages)
Titles exceeding 60 characters - will be truncated in search results

### 5. **Meta Description Too Long** (168,703 indexable pages)
Descriptions exceeding 160 characters

### 6. **3XX Redirects** (358 instances)
Some redirect chains that should be flattened

---

## 📋 ACTION PLAN

### Phase 1: Fix Orphan Pages (CRITICAL - Do Today)

#### Solution A: Add Internal Navigation
Create an **internal linking structure** for repair pages:

1. **Add "Related Repairs" section** to each repair guide page
   - Show 5-10 related repairs for same vehicle
   - Link to popular repairs for other years/models
   
2. **Create repair category pages**
   - `/repair/oil-change` - Lists all oil-change guides by popularity
   - `/repair/brake-pad-replacement` - Lists all brake guides
   - Etc for each of the 14 repair types

3. **Add "Popular Guides" widget** to homepage/footer
   - Top 10-20 most searched repairs
   - Rotates or shows different ones per visit

4. **Breadcrumbs** on each repair page:
   ```
   Home > Repairs > Toyota > Camry > 2020 > Oil Change
   ```

#### Solution B: Update Sitemap (Quick Win)
Currently sitemap only lists pages, but they have no internal links. The sitemap IS working (pages are indexed), but this is fragile.

### Phase 2: Fix Metadata Issues

1. **Shorten titles** to <60 chars
   - Current: "Oil Change — 1998 toyota camry | Step-by-Step DIY Guide"  
   - Better: "1998 Toyota Camry Oil Change Guide"

2. **Shorten meta descriptions** to <160 chars

3. **Add complete OG tags** to all pages
   - og:image (generate or use placeholder)
   - og:description
   - og:title

### Phase 3: Remove/Fix Canonical Issues
- Fix `/diagnose` page canonical or remove from sitemap

---

## 💡 RECOMMENDED: Internal Linking Structure

```
Homepage
├── Popular Repairs (widget)
│   ├── 2020 Toyota Camry Oil Change
│   ├── 2019 Honda Civic Brake Pads
│   └── ...
│
├── Repairs by Task
│   ├── /repairs/oil-change (category page)
│   ├── /repairs/brake-pad-replacement
│   └── ...
│
└── Each Repair Guide Page
    ├── Breadcrumbs (Home > Toyota > Camry > 2020 > Oil Change)
    ├── Related Repairs for this vehicle
    └── Popular repairs in same category
```

---

## 📊 METRICS TO TRACK

After implementing fixes:
- ✅ Orphan pages count (should go from 498 → 0)
- ✅ Average position in search results
- ✅ Organic traffic to repair pages
- ✅ Internal PageRank distribution (use Screaming Frog)

---

## NEXT STEPS

1. **TODAY:** Create internal linking components (Related Repairs, Popular Guides)
2. **THIS WEEK:** Add category pages for each repair type
3. **THIS WEEK:** Fix meta descriptions/titles in bulk
4. **ONGOING:** Monitor index status in Google Search Console
