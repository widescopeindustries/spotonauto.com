import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROFILES_PATH = join(__dirname, '../../src/data/vehicle-repair-profiles.json');

const DEFAULT_AMAZON_AFFILIATE_TAG = 'aiautorepair-20';
const AMAZON_AFFILIATE_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG?.trim() || DEFAULT_AMAZON_AFFILIATE_TAG;

const AMAZON_QUERY_REPLACEMENTS = [
  [/\bsee repair guide for specific parts\b/gi, 'parts'],
  [/\bpart number varies by engine type\b/gi, ''],
  [/\bcheck your vin\b/gi, ''],
  [/\binspect\/replace if worn\b/gi, ''],
  [/\((?:inspect|recommended|vehicle specific)\)/gi, ''],
];

function normalizeAmazonSearchQuery(query) {
  const original = query.trim().replace(/\s+/g, ' ');
  if (!original) return '';

  let cleaned = original;
  for (const [pattern, replacement] of AMAZON_QUERY_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned
    .replace(/[()]/g, ' ')
    .replace(/\s*[-,:;]+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || original;
}

function buildAmazonSearchUrl(query, department = 'automotive', subtag) {
  const normalizedQuery = normalizeAmazonSearchQuery(query);
  const params = new URLSearchParams({
    k: normalizedQuery,
    tag: AMAZON_AFFILIATE_TAG,
  });

  if (department) {
    params.set('i', department);
  }

  if (subtag) {
    params.set('ascsubtag', subtag);
  }

  return `https://www.amazon.com/s?${params.toString()}`;
}

function main() {
  const raw = readFileSync(PROFILES_PATH, 'utf-8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.profiles)) {
    console.error('Invalid profiles file: missing profiles array');
    process.exit(1);
  }

  let enrichedProfiles = 0;
  let totalPartLinks = 0;
  let totalToolLinks = 0;

  for (const profile of data.profiles) {
    const content = profile.profile;
    if (!content) continue;

    // Skip if already enriched
    if (content.affiliateLinks) {
      continue;
    }

    const hasParts = Array.isArray(content.partsNeeded) && content.partsNeeded.length > 0;
    const hasTools = Array.isArray(content.toolsNeeded) && content.toolsNeeded.length > 0;

    if (!hasParts && !hasTools) {
      continue;
    }

    const detailedAffiliateLinks = {
      parts: [],
      tools: [],
    };

    // Flat structure for repair page UI (single link per category)
    const flatAffiliateLinks = {
      parts: { amazon: '' },
      tools: { amazon: '' },
    };

    const { year, make, model } = profile;

    if (hasParts) {
      const firstPart = content.partsNeeded[0];
      const partsQuery = `${year} ${make} ${model} ${firstPart.name}`;
      flatAffiliateLinks.parts.amazon = buildAmazonSearchUrl(partsQuery);

      for (const part of content.partsNeeded) {
        const searchQuery = `${year} ${make} ${model} ${part.name}`;
        const links = [
          {
            provider: 'Amazon',
            url: buildAmazonSearchUrl(searchQuery),
            badge: 'Prime',
          },
        ];

        detailedAffiliateLinks.parts.push({
          name: part.name,
          partNumber: part.partNumber || '',
          links,
        });

        totalPartLinks += links.length;
      }
    }

    if (hasTools) {
      const firstTool = content.toolsNeeded[0];
      const toolsQuery = `${year} ${make} ${model} ${firstTool.name}`;
      flatAffiliateLinks.tools.amazon = buildAmazonSearchUrl(toolsQuery);

      for (const tool of content.toolsNeeded) {
        const searchQuery = `${year} ${make} ${model} ${tool.name}`;
        const links = [
          {
            provider: 'Amazon',
            url: buildAmazonSearchUrl(searchQuery),
            badge: 'Prime',
          },
        ];

        detailedAffiliateLinks.tools.push({
          name: tool.name,
          size: tool.size || '',
          links,
        });

        totalToolLinks += links.length;
      }
    }

    content.affiliateLinks = flatAffiliateLinks;
    content.detailedAffiliateLinks = detailedAffiliateLinks;
    enrichedProfiles++;
  }

  writeFileSync(PROFILES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(
    `Enriched ${enrichedProfiles} profiles with ${totalPartLinks} part links and ${totalToolLinks} tool links`
  );
}

main();
