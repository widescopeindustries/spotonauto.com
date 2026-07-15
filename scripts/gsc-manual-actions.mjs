import { google } from 'googleapis';
import fs from 'fs';

const credentials = JSON.parse(fs.readFileSync('credentials/google-service-account.json', 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const webmasters = google.webmasters({ version: 'v3', auth });

try {
  const res = await webmasters.sites.list();
  console.log('Sites:', res.data.siteEntry?.map(s => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })) || 'none');
} catch (e) {
  console.log('Sites list error:', e.message);
}

try {
  const res = await webmasters.searchanalytics.query({
    siteUrl: 'sc-domain:alloemmanuals.com',
    requestBody: { startDate: '2026-06-01', endDate: '2026-07-09', dimensions: ['date'] },
  });
  console.log('Recent data points:', res.data.rows?.length || 0);
} catch (e) {
  console.log('Search analytics error:', e.message);
}
