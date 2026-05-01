import { CHARM_ARCHIVE_BASE } from "@/lib/charmBase";

const CHARM_BASE = CHARM_ARCHIVE_BASE;
const FETCH_TIMEOUT = 15000;
const FETCH_RETRIES = 2;

function buildFetchOpts(): RequestInit {
  return {
    headers: {
      "User-Agent": "SpotOnAuto/1.0 (+https://spotonauto.com) maintenance-guide-builder",
    },
    signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout
      ? AbortSignal.timeout(FETCH_TIMEOUT)
      : undefined,
    cache: "no-store",
  };
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, buildFetchOpts());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (err) {
      lastError = err;
      if (attempt === FETCH_RETRIES) break;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Fetch failed");
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value).replace(/\(/g, "%28").replace(/\)/g, "%29");
}

function extractFolders(html: string): Array<{ name: string; variants: Array<{ label: string; href: string }> }> {
  const folders: Array<{ name: string; variants: Array<{ label: string; href: string }> }> = [];
  const folderRegex = /<li\s+class=["']li-folder["'][^>]*>\s*<a[^>]*>([^<]+)<\/a>\s*<ul>([\s\S]*?)<\/ul>/gi;
  let folderMatch;
  while ((folderMatch = folderRegex.exec(html)) !== null) {
    const name = folderMatch[1].trim();
    const ulContent = folderMatch[2];
    const variants: Array<{ label: string; href: string }> = [];
    const variantRegex = /<li>\s*<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>\s*<\/li>/gi;
    let variantMatch;
    while ((variantMatch = variantRegex.exec(ulContent)) !== null) {
      variants.push({ href: variantMatch[1], label: variantMatch[2].trim() });
    }
    if (variants.length > 0) {
      folders.push({ name, variants });
    }
  }
  return folders;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OilSpec {
  capacityQt: string;
  capacityL: string;
  oilType: string;
  note?: string;
}

export interface TireSpec {
  size: string;
  pressureFront: string;
  pressureRear: string;
  loadIndex: string;
  speedRating: string;
  rimSize: string;
}

export interface MaintenanceData {
  year: string;
  make: string;
  model: string;
  variant: string;
  variantHref: string;
  oil: OilSpec | null;
  tires: TireSpec | null;
  rawFluidHtml: string;
  rawTireHtml: string;
}

// ─── Vehicle Discovery ───────────────────────────────────────────────────────

export async function listVariants(year: string, make: string, model: string): Promise<Array<{ label: string; href: string }>> {
  const yearUrl = `${CHARM_BASE}/${encodeSegment(make)}/${year}/`;
  const html = await fetchText(yearUrl);
  const folders = extractFolders(html);

  const modelLower = model.toLowerCase();
  for (const folder of folders) {
    if (folder.name.toLowerCase().includes(modelLower)) {
      return folder.variants;
    }
  }
  for (const folder of folders) {
    if (folder.name.toLowerCase().startsWith(modelLower)) {
      return folder.variants;
    }
  }
  return [];
}

export function pickBestVariant(variants: Array<{ label: string; href: string }>, preferredEngine?: string): { label: string; href: string } | null {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0];

  if (preferredEngine) {
    const normalized = preferredEngine.toLowerCase().replace(/[^a-z0-9.]/g, "");
    const match = variants.find((v) =>
      v.label.toLowerCase().replace(/[^a-z0-9.]/g, "").includes(normalized)
    );
    if (match) return match;
  }

  const scored = variants.map((v) => {
    const label = v.label.toLowerCase();
    let score = 0;
    if (/\b\d+\.\d+l?\b/.test(label)) score += 10;
    if (/\bvin\s+[a-z0-9]\b/.test(label)) score += 5;
    if (/\bdohc\b|\bsohc\b|\bv6\b|\bv8\b|\bv10\b|\bturbo\b/.test(label)) score += 5;
    return { variant: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].variant;
}

// ─── Oil Data Parsing ────────────────────────────────────────────────────────

function parseFluidTable(html: string): OilSpec | null {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 6) continue;

    const cellTexts = cells.map((c) =>
      c.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim()
    );

    const fluidName = cellTexts[0]?.toLowerCase() || "";
    if (fluidName.includes("engine oil")) {
      return {
        capacityQt: cellTexts[3] || "",
        capacityL: cellTexts[4] || "",
        oilType: cellTexts[5] || "",
        note: cellTexts[6] || undefined,
      };
    }
  }
  return null;
}

// ─── Tire Data Parsing ───────────────────────────────────────────────────────

function parseTireTable(html: string): TireSpec | null {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 8) continue;

    const cellTexts = cells.map((c) =>
      c.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim()
    );

    const size = cellTexts[5];
    if (size && size.match(/P\d+\/\d+R\d+/)) {
      return {
        size,
        pressureFront: cellTexts[7]?.split("-")[0]?.trim() || "",
        pressureRear: cellTexts[7]?.split("-")[1]?.trim() || cellTexts[7]?.split("-")[0]?.trim() || "",
        loadIndex: cellTexts[4] || "",
        speedRating: "",
        rimSize: cellTexts[10] || "",
      };
    }
  }
  return null;
}

// ─── Main Fetcher ────────────────────────────────────────────────────────────

export async function fetchMaintenanceData(
  year: string,
  make: string,
  model: string,
  preferredEngine?: string,
): Promise<MaintenanceData | null> {
  const variants = await listVariants(year, make, model);
  if (variants.length === 0) return null;

  const variant = pickBestVariant(variants, preferredEngine);
  if (!variant) return null;

  const fluidPath = variant.href.replace(/\/$/, "") + "/Repair%20and%20Diagnosis/Quick%20Lookups/Fluids/";
  const tirePath = variant.href.replace(/\/$/, "") + "/Repair%20and%20Diagnosis/Quick%20Lookups/Tire%20Fitment/";

  const [fluidHtml, tireHtml] = await Promise.all([
    fetchText(`${CHARM_BASE}${fluidPath}`).catch(() => ""),
    fetchText(`${CHARM_BASE}${tirePath}`).catch(() => ""),
  ]);

  const oil = fluidHtml ? parseFluidTable(fluidHtml) : null;
  const tires = tireHtml ? parseTireTable(tireHtml) : null;

  return {
    year,
    make,
    model,
    variant: variant.label,
    variantHref: variant.href,
    oil,
    tires,
    rawFluidHtml: fluidHtml,
    rawTireHtml: tireHtml,
  };
}
