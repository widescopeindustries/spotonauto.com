
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import 'dotenv/config';

// Load credentials from environment
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!clientEmail || !privateKey) {
    console.error('Error: GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are required in .env');
    process.exit(1);
}

const auth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/indexing']
);

const indexing = google.indexing('v3');

async function submitUrl(url) {
    try {
        const response = await indexing.urlNotifications.publish({
            auth,
            requestBody: {
                url,
                type: 'URL_UPDATED',
            },
        });
        console.log(`Successfully submitted: ${url}`);
        return response.data;
    } catch (error) {
        console.error(`Error submitting ${url}:`, error.message);
        return null;
    }
}

async function runIndexing() {
    const sitemapPath = resolve('./public/sitemap.xml');
    try {
        const sitemapContent = readFileSync(sitemapPath, 'utf-8');
        // Extract URLs from sitemap.xml using simple regex
        const urls = sitemapContent.match(/<loc>(.*?)<\/loc>/g).map(loc => loc.replace(/<\/?loc>/g, ''));

        console.log(`Found ${urls.length} URLs in sitemap.`);

        // Batch submit (Indexing API has limits, usually 100-200 per day by default, but we can try)
        // For thousands of URLs, we should probably only index the most important ones or use chunks
        const limit = 200; // Default daily quota
        const toProcess = urls.slice(0, limit);

        console.log(`Submitting first ${toProcess.length} URLs...`);

        for (const url of toProcess) {
            await submitUrl(url);
            // Slight delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
        }

        console.log('Indexing submission complete.');
    } catch (err) {
        console.error('Failed to process sitemap:', err.message);
    }
}

runIndexing().catch(console.error);
