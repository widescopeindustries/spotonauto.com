
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

async function runIndexing() {
    const jsonPath = resolve('./service-account.json');

    if (!existsSync(jsonPath)) {
        console.error('Error: service-account.json not found.');
        process.exit(1);
    }

    console.log('Authenticating with Google Indexing API...');

    // Now that JSON is fixed, we can use the standard auth methods
    const auth = new google.auth.GoogleAuth({
        keyFile: jsonPath,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({
        version: 'v3',
        auth: auth,
    });

    async function submitUrl(url) {
        try {
            // Correct format using the auth client
            await indexing.urlNotifications.publish({
                requestBody: {
                    url,
                    type: 'URL_UPDATED',
                },
            });
            console.log(`Successfully submitted: ${url}`);
        } catch (error) {
            console.error(`Error submitting ${url}:`, error.response?.data?.error?.message || error.message);
        }
    }

    const sitemapPath = resolve('./public/sitemap.xml');
    try {
        if (!existsSync(sitemapPath)) {
            console.error(`Sitemap not found at ${sitemapPath}`);
            return;
        }
        const sitemapContent = readFileSync(sitemapPath, 'utf-8');
        let urls = sitemapContent.match(/<loc>(.*?)<\/loc>/g)?.map(loc => loc.replace(/<\/?loc>/g, '')) || [];

        if (urls.length === 0) {
            console.error('No URLs found in sitemap.');
            return;
        }

        console.log(`Found ${urls.length} URLs in sitemap.`);

        // Final sanity check on URLs - ensure they use the correct production domain
        const correctDomain = 'https://ai-auto-repair-mobile.vercel.app';
        urls = urls.map(url => {
            if (url.includes('ai-auto-repair.vercel.app')) {
                return url.replace('https://ai-auto-repair.vercel.app', correctDomain);
            }
            return url;
        });

        const limit = 200;
        const toProcess = urls.slice(0, limit);

        console.log(`Submitting first ${toProcess.length} URLs to Google...`);

        for (const url of toProcess) {
            await submitUrl(url);
            // Slight delay to be safe
            await new Promise(r => setTimeout(r, 600));
        }

        console.log('Indexing submission complete.');
    } catch (err) {
        console.error('Failed to process sitemap:', err.message);
    }
}

runIndexing().catch(console.error);
