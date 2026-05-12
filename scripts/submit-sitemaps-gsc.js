/**
 * Submit sitemaps to Google Search Console via Webmasters API
 * Uses the same service account added to the alloemmanuals.com property.
 */

const { google } = require('googleapis');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:alloemmanuals.com';

const SITEMAPS = [
  'https://alloemmanuals.com/sitemap.xml',
  'https://alloemmanuals.com/codes/sitemap.xml',
  'https://alloemmanuals.com/repair/sitemap.xml',
  'https://alloemmanuals.com/manual/sitemap.xml',
  'https://alloemmanuals.com/wiring/sitemap.xml',
];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });

  console.log('Submitting sitemaps to GSC for', SITE_URL);
  console.log();

  for (const sitemapUrl of SITEMAPS) {
    try {
      await webmasters.sitemaps.submit({
        siteUrl: SITE_URL,
        feedpath: sitemapUrl,
      });
      console.log('✅ Submitted:', sitemapUrl);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log('⚠️  Already exists:', sitemapUrl);
      } else {
        console.log('❌ Failed:', sitemapUrl, '-', msg);
      }
    }
  }

  console.log();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
