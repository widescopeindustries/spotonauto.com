import { MetadataRoute } from 'next'
import { TOOL_PAGES } from '@/data/tools-pages';
import { getSitemapLastMod } from '@/lib/sitemap';

const LAST_MOD = getSitemapLastMod();

/**
 * Main sitemap — static pages, tool pages, guide pages.
 *
 * Sub-sitemaps (served separately, discovered via robots.txt):
 *   /codes/sitemap.xml         — ~300 DTC code pages
 *   /community/sitemap.xml     — community category + thread pages
 *   /repair/sitemap.xml        — repair sitemap index -> chunked child files
 *
 * NOTE: /diagnose intentionally omitted — it sets canonical to /
 * and including it in the sitemap confuses crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://alloemmanuals.com';
    const entries: MetadataRoute.Sitemap = [];

    // ── Static pages ──────────────────────────────────────────────────
    // NOTE: Generic cross-vehicle landing pages (/repair, /parts, /tools,
    // /wiring, /manual, /guides, /symptoms) are intentionally noindex per
    // the Vehicle-Specific-Only principle. They are NOT included here.
    entries.push(
        { url: baseUrl, lastModified: LAST_MOD, changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/codes`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.75 },
        { url: `${baseUrl}/second-opinion`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/maintenance`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.85 },
        { url: `${baseUrl}/about`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/author/alloemmanuals-editorial-team`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.45 },
        { url: `${baseUrl}/author/lyndon-bedford`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.45 },
        { url: `${baseUrl}/blog/amazon-auto-parts-by-vehicle-year-and-type`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/contact`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${baseUrl}/privacy-policy`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.35 },
        { url: `${baseUrl}/terms-of-service`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.35 },
        { url: `${baseUrl}/disclaimer`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.35 },
    );

    // ── Tool pages (~90 high-priority) ────────────────────────────────
    // Tool pages have conditional noindex (thin content fallback).
    // They remain in the sitemap; noindex is applied at the page level.
    for (const tp of TOOL_PAGES) {
        if (!tp?.slug) continue;
        entries.push({
            url: `${baseUrl}/tools/${tp.slug}`,
            lastModified: LAST_MOD,
            changeFrequency: 'monthly',
            priority: 0.8,
        });
    }

    return entries;
}
