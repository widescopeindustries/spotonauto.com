
import { google } from 'googleapis';
import { resolve } from 'path';

async function testIndexing() {
    const jsonPath = resolve('./service-account.json');
    const auth = new google.auth.GoogleAuth({
        keyFile: jsonPath,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const authClient = await auth.getClient();
    const indexing = google.indexing('v3');

    try {
        const url = 'https://ai-auto-repair-mobile.vercel.app/';
        console.log(`Testing submission for: ${url}`);
        const res = await indexing.urlNotifications.publish({
            auth: authClient,
            requestBody: {
                url,
                type: 'URL_UPDATED',
            },
        });
        console.log('Success!', res.data);
    } catch (error) {
        console.error('FULL ERROR:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
    }
}

testIndexing().catch(console.error);
