
const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve('./service-account.json');
try {
    const rawContent = fs.readFileSync(jsonPath, 'utf8');
    console.log('Original content length:', rawContent.length);

    // Sanitize: Replace literal newlines within the private_key string
    // This looks for "private_key": "..." and replaces literal newlines inside the quotes with \n
    const sanitized = rawContent.replace(/("private_key":\s*")([\s\S]*?)(")/, (match, p1, p2, p3) => {
        return p1 + p2.replace(/\r?\n/g, '\\n') + p3;
    });

    // Check if it parses now
    const key = JSON.parse(sanitized);
    console.log('JSON is now valid. Client email:', key.client_email);

    // Write back the clean version
    fs.writeFileSync(jsonPath, JSON.stringify(key, null, 2), 'utf8');
    console.log('Successfully fixed service-account.json');
} catch (err) {
    console.error('Failed to fix service-account.json:', err.message);
}
