const { google } = require('googleapis');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const URLS = [
  'https://alloemmanuals.com/repair/2008/honda/civic/spark-plug-replacement',
  'https://alloemmanuals.com/repair/2013/honda/cr-v/oil-change',
  'https://alloemmanuals.com/repair/2013/honda/cr-v/spark-plug-replacement',
  'https://alloemmanuals.com/repair/2012/ford/f-150/brake-pad-replacement',
  'https://alloemmanuals.com/repair/2010/toyota/corolla/spark-plug-replacement',
  'https://alloemmanuals.com/repair/2010/honda/cr-v/battery-replacement',
  'https://alloemmanuals.com/repair/2007/subaru/outback/water-pump-replacement',
  'https://alloemmanuals.com/repair/2012/hyundai/elantra/spark-plug-replacement',
  'https://alloemmanuals.com/repair/2012/ford/fusion/oil-change',
  'https://alloemmanuals.com/repair/2013/ford/fusion/starter-replacement',
  'https://alloemmanuals.com/repair/2011/ford/f-150/thermostat-replacement',
  'https://alloemmanuals.com/repair/1996/toyota/corolla/thermostat-replacement',
];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const client = await auth.getClient();
  const indexing = google.indexing({ version: 'v3', auth: client });

  console.log(`Submitting ${URLS.length} URLs to Google Search Console...\n`);
  let ok = 0;
  let fail = 0;

  for (const url of URLS) {
    try {
      await indexing.urlNotifications.publish({
        requestBody: { type: 'URL_UPDATED', url },
      });
      console.log(`  ✅ ${url}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ ${url}: ${e.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone: ${ok} OK, ${fail} failed`);
}

main().catch(e => { console.error(e); process.exit(1); });
