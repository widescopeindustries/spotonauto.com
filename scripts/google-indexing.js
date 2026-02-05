/**
 * Google Search Console Indexing API Integration
 *
 * Tracks progress across runs to handle daily quota limits.
 * Run daily until all invalid URLs are processed.
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Paths
const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const PROGRESS_PATH = path.join(__dirname, 'indexing-progress.json');

// Vehicle production years - ACCURATE DATA
const VEHICLE_PRODUCTION_YEARS = {
  Toyota: {
    Camry: { start: 1983, end: 2024 },
    Corolla: { start: 1966, end: 2024 },
    RAV4: { start: 1996, end: 2024 },
    Highlander: { start: 2001, end: 2024 },
    Tacoma: { start: 1995, end: 2024 },
    Tundra: { start: 2000, end: 2024 },
    Prius: { start: 2001, end: 2024 },
    Sienna: { start: 1998, end: 2024 },
  },
  Honda: {
    Civic: { start: 1973, end: 2024 },
    Accord: { start: 1976, end: 2024 },
    'CR-V': { start: 1997, end: 2024 },
    Pilot: { start: 2003, end: 2024 },
    Odyssey: { start: 1995, end: 2024 },
    Fit: { start: 2007, end: 2020 },
  },
  Ford: {
    'F-150': { start: 1975, end: 2024 },
    Escape: { start: 2001, end: 2024 },
    Explorer: { start: 1991, end: 2024 },
    Focus: { start: 2000, end: 2018 },
    Fusion: { start: 2006, end: 2020 },
    Mustang: { start: 1965, end: 2024 },
    Edge: { start: 2007, end: 2024 },
  },
  Chevrolet: {
    Silverado: { start: 1999, end: 2024 },
    Equinox: { start: 2005, end: 2024 },
    Malibu: { start: 1964, end: 2024 },
    Tahoe: { start: 1995, end: 2024 },
    Suburban: { start: 1935, end: 2024 },
    Impala: { start: 1958, end: 2020 },
  },
  Nissan: {
    Altima: { start: 1993, end: 2024 },
    Rogue: { start: 2008, end: 2024 },
    Sentra: { start: 1982, end: 2024 },
    Versa: { start: 2007, end: 2024 },
    Pathfinder: { start: 1986, end: 2024 },
  },
  Hyundai: {
    Elantra: { start: 1991, end: 2024 },
    Sonata: { start: 1989, end: 2024 },
    Tucson: { start: 2005, end: 2024 },
    'Santa Fe': { start: 2001, end: 2024 },
  },
  Kia: {
    Optima: { start: 2001, end: 2020 },
    Sorento: { start: 2003, end: 2024 },
    Soul: { start: 2010, end: 2024 },
    Sportage: { start: 1995, end: 2024 },
  },
  BMW: {
    '3 Series': { start: 1975, end: 2024 },
    '5 Series': { start: 1972, end: 2024 },
    X3: { start: 2004, end: 2024 },
    X5: { start: 2000, end: 2024 },
  },
  Mercedes: {
    'C-Class': { start: 1994, end: 2024 },
    'E-Class': { start: 1986, end: 2024 },
    GLC: { start: 2016, end: 2024 },
    GLE: { start: 2016, end: 2024 },
  },
  Jeep: {
    'Grand Cherokee': { start: 1993, end: 2024 },
    Wrangler: { start: 1987, end: 2024 },
    Cherokee: { start: 1984, end: 2024 },
  },
  Subaru: {
    Outback: { start: 1995, end: 2024 },
    Forester: { start: 1998, end: 2024 },
    Crosstrek: { start: 2013, end: 2024 },
  },
};

const TASKS = [
  'oil-change',
  'brake-pad-replacement',
  'brake-rotor-replacement',
  'alternator-replacement',
  'starter-replacement',
  'battery-replacement',
  'spark-plug-replacement',
  'radiator-replacement',
  'thermostat-replacement',
  'water-pump-replacement',
  'serpentine-belt-replacement',
  'cabin-air-filter-replacement',
  'engine-air-filter-replacement',
  'headlight-bulb-replacement',
];

const SITEMAP_YEARS = Array.from({ length: 2013 - 1982 + 1 }, (_, i) => 1982 + i);
const BASE_URL = 'https://spotonauto.com';

// Progress tracking
function loadProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
  }
  return {
    removalsProcessed: 0,
    indexingProcessed: 0,
    lastRun: null,
    totalRemovals: 0,
    totalIndexing: 0,
    successfulRemovals: 0,
    successfulIndexing: 0,
  };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

class GoogleIndexingService {
  constructor() {
    this.auth = null;
    this.indexing = null;
    this.quotaExhausted = false;
  }

  async initialize() {
    if (!fs.existsSync(KEY_PATH)) {
      throw new Error(`Credentials file not found at ${KEY_PATH}`);
    }

    const keyFile = fs.readFileSync(KEY_PATH, 'utf8');
    const credentials = JSON.parse(keyFile);

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    this.indexing = google.indexing({ version: 'v3', auth: this.auth });

    console.log('✓ Google Indexing API initialized');
    console.log(`  Service account: ${credentials.client_email}`);
  }

  getInvalidUrls() {
    const invalidUrls = [];

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
      const makeSlug = make.toLowerCase().replace(/\s+/g, '-');

      for (const [model, years] of Object.entries(models)) {
        const modelSlug = model.toLowerCase().replace(/\s+/g, '-');

        for (const year of SITEMAP_YEARS) {
          if (year < years.start || year > years.end) {
            for (const task of TASKS) {
              invalidUrls.push(`${BASE_URL}/repair/${year}/${makeSlug}/${modelSlug}/${task}`);
            }
          }
        }
      }
    }

    return invalidUrls;
  }

  getValidUrls() {
    const validUrls = [];

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
      const makeSlug = make.toLowerCase().replace(/\s+/g, '-');

      for (const [model, years] of Object.entries(models)) {
        const modelSlug = model.toLowerCase().replace(/\s+/g, '-');

        for (const year of SITEMAP_YEARS) {
          if (year >= years.start && year <= years.end) {
            for (const task of TASKS) {
              validUrls.push(`${BASE_URL}/repair/${year}/${makeSlug}/${modelSlug}/${task}`);
            }
          }
        }
      }
    }

    return validUrls;
  }

  async requestUrlRemoval(url) {
    if (this.quotaExhausted) return { success: false, error: 'Quota exhausted' };

    try {
      const response = await this.indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_DELETED' },
      });
      return { success: true, data: response.data };
    } catch (error) {
      if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('rateLimitExceeded')) {
        this.quotaExhausted = true;
        return { success: false, error: 'Quota exhausted', quotaHit: true };
      }
      return { success: false, error: error.message };
    }
  }

  async requestUrlIndexing(url) {
    if (this.quotaExhausted) return { success: false, error: 'Quota exhausted' };

    try {
      const response = await this.indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_UPDATED' },
      });
      return { success: true, data: response.data };
    } catch (error) {
      if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('rateLimitExceeded')) {
        this.quotaExhausted = true;
        return { success: false, error: 'Quota exhausted', quotaHit: true };
      }
      return { success: false, error: error.message };
    }
  }

  async processUrlsWithProgress(urls, action, startIndex, label) {
    const results = { success: 0, failed: 0, processed: 0 };
    const urlsToProcess = urls.slice(startIndex);

    console.log(`\nStarting from URL #${startIndex + 1}, ${urlsToProcess.length} remaining...\n`);

    for (let i = 0; i < urlsToProcess.length; i++) {
      const url = urlsToProcess[i];
      const result = await action(url);

      results.processed++;

      if (result.quotaHit) {
        console.log(`\n\n⚠️  QUOTA EXHAUSTED after ${results.processed} requests`);
        console.log(`   Run again tomorrow to continue from URL #${startIndex + i + 1}`);
        break;
      }

      if (result.success) {
        results.success++;
        process.stdout.write('.');
      } else {
        results.failed++;
        process.stdout.write('x');
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Progress indicator every 50 URLs
      if ((i + 1) % 50 === 0) {
        console.log(` [${startIndex + i + 1}/${urls.length}]`);
      }
    }

    return results;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       SpotOn Auto - Google Indexing API Repair Tool          ║');
  console.log('║                  (With Progress Tracking)                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const service = new GoogleIndexingService();
  const progress = loadProgress();

  try {
    await service.initialize();

    const invalidUrls = service.getInvalidUrls();
    const validUrls = service.getValidUrls();

    // Update totals
    progress.totalRemovals = invalidUrls.length;
    progress.totalIndexing = validUrls.length;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                         PROGRESS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Invalid URL Removals:  ${progress.removalsProcessed}/${invalidUrls.length} (${((progress.removalsProcessed/invalidUrls.length)*100).toFixed(1)}%)`);
    console.log(`  Valid URL Indexing:    ${progress.indexingProcessed}/${validUrls.length} (${((progress.indexingProcessed/validUrls.length)*100).toFixed(1)}%)`);
    console.log(`  Last run:              ${progress.lastRun || 'Never'}`);
    console.log(`  Successful removals:   ${progress.successfulRemovals}`);

    const args = process.argv.slice(2);

    if (args.includes('--remove-invalid')) {
      if (progress.removalsProcessed >= invalidUrls.length) {
        console.log('\n✓ All invalid URLs have been processed for removal!');
      } else {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('              REQUESTING REMOVAL OF INVALID URLs');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const results = await service.processUrlsWithProgress(
          invalidUrls,
          url => service.requestUrlRemoval(url),
          progress.removalsProcessed,
          'Removal'
        );

        progress.removalsProcessed += results.processed;
        progress.successfulRemovals += results.success;
        progress.lastRun = new Date().toISOString();
        saveProgress(progress);

        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  This run: ${results.success} succeeded, ${results.failed} failed`);
        console.log(`  Total progress: ${progress.removalsProcessed}/${invalidUrls.length} URLs`);
        console.log(`  Days remaining (at 200/day): ~${Math.ceil((invalidUrls.length - progress.removalsProcessed) / 200)}`);
      }
    }

    if (args.includes('--index-valid')) {
      if (progress.indexingProcessed >= validUrls.length) {
        console.log('\n✓ All valid URLs have been processed for indexing!');
      } else {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('              REQUESTING INDEXING OF VALID URLs');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const results = await service.processUrlsWithProgress(
          validUrls,
          url => service.requestUrlIndexing(url),
          progress.indexingProcessed,
          'Indexing'
        );

        progress.indexingProcessed += results.processed;
        progress.successfulIndexing += results.success;
        progress.lastRun = new Date().toISOString();
        saveProgress(progress);

        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  This run: ${results.success} succeeded, ${results.failed} failed`);
        console.log(`  Total progress: ${progress.indexingProcessed}/${validUrls.length} URLs`);
      }
    }

    if (args.includes('--reset')) {
      fs.unlinkSync(PROGRESS_PATH);
      console.log('✓ Progress reset');
    }

    if (args.length === 0 || args.includes('--help')) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('                          USAGE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  node scripts/google-indexing.js');
      console.log('    Show progress only\n');
      console.log('  node scripts/google-indexing.js --remove-invalid');
      console.log('    Continue removing invalid URLs (auto-resumes)\n');
      console.log('  node scripts/google-indexing.js --index-valid');
      console.log('    Continue requesting indexing of valid URLs\n');
      console.log('  node scripts/google-indexing.js --reset');
      console.log('    Reset progress tracking\n');
      console.log('\n  NOTE: Google Indexing API has ~200 requests/day quota.');
      console.log('        Run this script daily until complete.\n');
    }

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { GoogleIndexingService, VEHICLE_PRODUCTION_YEARS, TASKS };

if (require.main === module) {
  main();
}
