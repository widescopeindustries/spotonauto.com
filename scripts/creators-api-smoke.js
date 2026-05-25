/**
 * Amazon Creators API smoke test
 *
 * Purpose:
 * - Validate env/config for Creators API credentials
 * - Request OAuth token
 * - Optionally hit a configured smoke endpoint
 * - Detect "AssociateNotEligible" and provide next actions
 *
 * Usage:
 *   node scripts/creators-api-smoke.js
 *
 * Required env vars:
 *   AMZN_CLIENT_ID
 *   AMZN_CLIENT_SECRET
 *
 * Optional env vars:
 *   AMZN_APP_ID                      (for logging only)
 *   AMZN_TOKEN_URL                   default: https://api.amazon.com/auth/o2/token
 *   AMZN_SCOPE                       optional scope string
 *   AMZN_CREATORS_SMOKE_URL          if set, performs API request with Bearer token
 *   AMZN_CREATORS_SMOKE_METHOD       default: POST
 *   AMZN_CREATORS_SMOKE_BODY         JSON string body for POST/PUT
 *   AMZN_CREATORS_SMOKE_HEADERS      JSON object string for extra headers
 */

const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function required(name) {
  const value = (process.env[name] || '').trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function safeMask(value, left = 8, right = 4) {
  if (!value) return '(empty)';
  if (value.length <= left + right) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function safeParseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function includesAssociateNotEligible(payloadText) {
  return /AssociateNotEligible/i.test(payloadText || '');
}

async function getAccessToken() {
  const tokenUrl = (process.env.AMZN_TOKEN_URL || 'https://api.amazon.com/auth/o2/token').trim();
  const clientId = required('AMZN_CLIENT_ID');
  const clientSecret = required('AMZN_CLIENT_SECRET');
  const scope = (process.env.AMZN_SCOPE || '').trim();

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  if (scope) body.set('scope', scope);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  });

  const text = await response.text();
  const json = safeParseJson(text, {});

  if (!response.ok) {
    const errorText = `${response.status} ${response.statusText} ${text}`;
    throw new Error(`Token request failed: ${errorText}`);
  }

  const accessToken = json.access_token;
  if (!accessToken) {
    throw new Error(`Token response missing access_token: ${text}`);
  }

  return {
    tokenUrl,
    accessToken,
    tokenType: json.token_type || 'Bearer',
    expiresIn: Number(json.expires_in || 0),
    raw: json,
  };
}

async function runSmokeCall(accessToken) {
  const smokeUrl = (process.env.AMZN_CREATORS_SMOKE_URL || '').trim();
  if (!smokeUrl) {
    return {
      skipped: true,
      reason: 'AMZN_CREATORS_SMOKE_URL not set',
    };
  }

  const method = (process.env.AMZN_CREATORS_SMOKE_METHOD || 'POST').toUpperCase();
  const bodyText = (process.env.AMZN_CREATORS_SMOKE_BODY || '').trim();
  const extraHeaders = safeParseJson(process.env.AMZN_CREATORS_SMOKE_HEADERS || '{}', {});
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...extraHeaders,
  };

  let body;
  if (bodyText && ['POST', 'PUT', 'PATCH'].includes(method)) {
    body = bodyText;
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(smokeUrl, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  const json = safeParseJson(text, null);
  const notEligible = includesAssociateNotEligible(text);

  return {
    skipped: false,
    url: smokeUrl,
    method,
    status: response.status,
    ok: response.ok,
    notEligible,
    json,
    text,
  };
}

async function main() {
  loadEnvLocal();

  const appId = (process.env.AMZN_APP_ID || '').trim();
  const clientId = (process.env.AMZN_CLIENT_ID || '').trim();

  console.log('=== Amazon Creators API Smoke Test ===');
  if (appId) console.log(`App ID: ${appId}`);
  console.log(`Client ID: ${safeMask(clientId)}`);

  const token = await getAccessToken();
  console.log('');
  console.log('Token request: OK');
  console.log(`- Token URL: ${token.tokenUrl}`);
  console.log(`- Access token: ${safeMask(token.accessToken, 12, 6)}`);
  console.log(`- Expires in: ${token.expiresIn}s`);

  const smoke = await runSmokeCall(token.accessToken);
  console.log('');

  if (smoke.skipped) {
    console.log(`Smoke API call: SKIPPED (${smoke.reason})`);
    console.log('Set AMZN_CREATORS_SMOKE_URL to test your target Creators endpoint.');
    return;
  }

  console.log(`Smoke API call: ${smoke.ok ? 'OK' : 'FAILED'}`);
  console.log(`- URL: ${smoke.url}`);
  console.log(`- Method: ${smoke.method}`);
  console.log(`- Status: ${smoke.status}`);

  if (smoke.notEligible) {
    console.log('');
    console.log('Detected AssociateNotEligible.');
    console.log('Next actions:');
    console.log('1. Reach 10 qualifying sales in last 30 days.');
    console.log('2. Wait up to 48 hours for eligibility refresh.');
    console.log('3. Re-run this smoke test.');
  } else if (!smoke.ok) {
    const preview = (smoke.text || '').slice(0, 600);
    console.log('');
    console.log('Response preview:');
    console.log(preview);
  }
}

main().catch((err) => {
  console.error('Smoke test failed:', err.message || err);
  process.exit(1);
});

