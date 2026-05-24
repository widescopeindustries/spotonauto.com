/**
 * Tool CTA A/B report (Amazon affiliate clicks)
 *
 * Usage:
 *   node scripts/tool-cta-ab-report.js
 *   node scripts/tool-cta-ab-report.js --days 7
 *   node scripts/tool-cta-ab-report.js --start 2026-05-24 --end 2026-05-31
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '537013586';

function getArg(name, fallback = null) {
  const exact = `--${name}`;
  const match = process.argv.find((arg) => arg === exact || arg.startsWith(`${exact}=`));
  if (!match) return fallback;
  if (match.startsWith(`${exact}=`)) return match.slice(exact.length + 1) || fallback;
  const idx = process.argv.indexOf(exact);
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return fallback;
  return next;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

async function buildClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }

  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return google.analyticsdata({ version: 'v1beta', auth });
}

function getDateRange() {
  const startArg = getArg('start', null);
  const endArg = getArg('end', null);
  const days = Number(getArg('days', '7'));

  if (startArg && endArg) {
    return { startDate: startArg, endDate: endArg };
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    startDate: addDays(today, -Math.max(1, days)),
    endDate: today,
  };
}

function pickVariant(subtag) {
  const tag = String(subtag || '');
  if (/-vA(?:-|$)/.test(tag)) return 'A';
  if (/-vB(?:-|$)/.test(tag)) return 'B';
  return null;
}

async function run() {
  const analytics = await buildClient();
  const dateRange = getDateRange();

  let response;
  try {
    response = await analytics.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [dateRange],
        dimensions: [
          { name: 'eventName' },
          { name: 'customEvent:subtag' },
        ],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
                },
              },
              {
                filter: {
                  fieldName: 'customEvent:subtag',
                  stringFilter: { matchType: 'CONTAINS', value: '-v' },
                },
              },
            ],
          },
        },
        limit: 5000,
      },
    });
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes('customEvent:subtag')) {
      console.error('GA4 custom dimension missing: customEvent:subtag');
      console.error('Create an event-scoped custom dimension named "subtag" in GA4, then rerun.');
      process.exit(1);
    }
    throw error;
  }

  const rows = response.data.rows || [];
  const buckets = { A: 0, B: 0 };
  const topSubtags = {};

  for (const row of rows) {
    const subtag = row.dimensionValues?.[1]?.value || '';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const variant = pickVariant(subtag);
    if (!variant) continue;

    buckets[variant] += count;
    topSubtags[subtag] = (topSubtags[subtag] || 0) + count;
  }

  const total = buckets.A + buckets.B;
  const aShare = total ? (buckets.A / total) * 100 : 0;
  const bShare = total ? (buckets.B / total) * 100 : 0;
  const delta = buckets.A - buckets.B;
  const winner = delta === 0 ? 'tie' : delta > 0 ? 'A (Shop Exact Match on Amazon)' : 'B (Check Fitment on Amazon)';

  console.log('');
  console.log(`Tool CTA A/B Report (${dateRange.startDate} → ${dateRange.endDate})`);
  console.log('Event: affiliate_click');
  console.log('');
  console.log(`Variant A clicks: ${fmt(buckets.A)} (${fmt(aShare, 1)}%)`);
  console.log(`Variant B clicks: ${fmt(buckets.B)} (${fmt(bShare, 1)}%)`);
  console.log(`Delta (A - B): ${fmt(delta)}`);
  console.log(`Winner: ${winner}`);
  console.log('');

  const top = Object.entries(topSubtags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (top.length) {
    console.log('Top CTA subtags:');
    for (const [subtag, count] of top) {
      console.log(`- ${subtag}: ${fmt(count)}`);
    }
    console.log('');
  }
}

run().catch((error) => {
  console.error('Failed to run tool CTA A/B report:', error?.message || error);
  process.exit(1);
});

