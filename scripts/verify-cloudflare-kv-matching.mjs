import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function compactSlug(value) {
  return slugify(value).replace(/-/g, '');
}

function tokenizeVehicleSlug(value) {
  return slugify(value)
    .split('-')
    .filter((token) => /\d/.test(token) || token.length >= 2);
}

function scoreVehicleModelMatch(requestedModel, candidateModel) {
  const requestedSlug = slugify(requestedModel);
  const candidateSlug = slugify(candidateModel);
  if (!requestedSlug || !candidateSlug) return 0;

  if (requestedSlug === candidateSlug) return 100;

  const requestedCompact = compactSlug(requestedSlug);
  const candidateCompact = compactSlug(candidateSlug);
  if (requestedCompact && requestedCompact === candidateCompact) return 95;

  const requestedTokens = tokenizeVehicleSlug(requestedSlug);
  const candidateTokens = tokenizeVehicleSlug(candidateSlug);
  if (!requestedTokens.length || !candidateTokens.length) return 0;

  const requestedNumericTokens = requestedTokens.filter((token) => /\d/.test(token));
  if (
    requestedNumericTokens.length > 0 &&
    !requestedNumericTokens.every((token) => candidateTokens.includes(token))
  ) {
    return 0;
  }

  if (requestedTokens.every((token) => candidateTokens.includes(token))) return 85;
  if (candidateTokens.every((token) => requestedTokens.includes(token))) return 80;
  if (requestedCompact.length >= 3 && candidateCompact.includes(requestedCompact)) return 70;

  const sharedTokens = requestedTokens.filter((token) => candidateTokens.includes(token));
  if (sharedTokens.length === 0) return 0;

  return 50 + Math.min(sharedTokens.length, 3) * 5;
}

async function listKeys(baseUrl, authToken, prefix, limit = 50) {
  const resp = await fetch(
    `${baseUrl}/keys?prefix=${encodeURIComponent(prefix)}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${authToken}` } },
  );

  if (!resp.ok) {
    throw new Error(`KV list failed (${resp.status}) for prefix ${prefix}`);
  }

  const payload = await resp.json();
  return payload.result || [];
}

async function fetchValue(baseUrl, authToken, key) {
  const resp = await fetch(
    `${baseUrl}/values/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${authToken}` } },
  );

  if (!resp.ok) {
    throw new Error(`KV get failed (${resp.status}) for key ${key}`);
  }

  return JSON.parse(await resp.text());
}

async function main() {
  loadEnv();

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

  if (!accountId || !apiToken || !namespaceId) {
    throw new Error('Missing Cloudflare KV env vars');
  }

  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`;

  const rawArgs = process.argv.slice(2);
  const samples = rawArgs.length >= 3 && rawArgs.length % 3 === 0
    ? Array.from({ length: rawArgs.length / 3 }, (_, index) => [
        rawArgs[index * 3],
        Number(rawArgs[index * 3 + 1]),
        rawArgs[index * 3 + 2],
      ])
    : [
        ['Ford', 2008, 'F-150'],
        ['Toyota', 2010, 'Camry'],
        ['Honda', 2011, 'Accord'],
      ];

  for (const [make, year, model] of samples) {
    const makeSlug = slugify(make);
    const modelSlug = slugify(model);

    const exactKeys = (await listKeys(baseUrl, apiToken, `vehicle:${makeSlug}:${year}:${modelSlug}:`, 20))
      .map((entry) => entry.name);
    const broaderKeys = exactKeys.length > 0
      ? exactKeys
      : (await listKeys(baseUrl, apiToken, `vehicle:${makeSlug}:${year}:`, 500)).map((entry) => entry.name);

    const ranked = broaderKeys
      .map((name) => {
        const parts = name.split(':');
        return {
          name,
          candidateModel: parts[3] || '',
          score: scoreVehicleModelMatch(model, parts[3] || ''),
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    const best = ranked[0] || null;
    const selectedKey = best && best.score > 0 ? best.name : null;
    const value = selectedKey ? await fetchValue(baseUrl, apiToken, selectedKey) : null;

    console.log(JSON.stringify({
      make,
      year,
      model,
      exactPrefixHits: exactKeys.length,
      bestKey: best?.name || null,
      bestScore: best?.score ?? null,
      selectedKey,
      variant: value?.v?.variant || null,
    }));
  }
}

main().catch((error) => {
  console.error('FATAL', error.message);
  process.exit(1);
});
