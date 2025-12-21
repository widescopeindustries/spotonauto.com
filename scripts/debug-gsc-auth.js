
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function debugAuth() {
    const rawContent = readFileSync('./service-account.json', 'utf8');
    const sanitized = rawContent.replace(/("private_key":\s*")([\s\S]*?)(")/, (match, p1, p2, p3) => {
        return p1 + p2.replace(/\r?\n/g, '\\n') + p3;
    });
    const key = JSON.parse(sanitized);

    const auth = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/indexing']
    );

    try {
        console.log('Attempting to get access token...');
        const token = await auth.getAccessToken();
        console.log('Token acquired successfully!');

        const indexing = google.indexing('v3');
        const url = 'https://ai-auto-repair-mobile.vercel.app/';
        console.log(`Testing indexing for ${url}`);

        const res = await indexing.urlNotifications.publish({
            auth: auth,
            requestBody: {
                url: url,
                type: 'URL_UPDATED'
            }
        });
        console.log('Indexing result:', res.data);
    } catch (err) {
        console.error('Auth Error Details:');
        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err);
        }
    }
}

debugAuth();
