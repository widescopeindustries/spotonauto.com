const https = require('https');

const key = 'b2e1ed9a4693444c8bf73f80fe75f1e0';
const urls = [
  "https://alloemmanuals.com/tools/mini-cooper-transmission-fluid-type",
  "https://alloemmanuals.com/tools/chrysler-pacifica-coolant-type",
  "https://alloemmanuals.com/tools/hyundai-elantra-battery-location",
  "https://alloemmanuals.com/tools/mitsubishi-outlander-coolant-type",
  "https://alloemmanuals.com/tools/land-rover-range-rover-sport-battery-location",
  "https://alloemmanuals.com/tools/ford-mustang-coolant-type",
  "https://alloemmanuals.com/tools/ford-f-250-spark-plug-type",
  "https://alloemmanuals.com/tools/ford-f-150-spark-plug-type",
  "https://alloemmanuals.com/tools/audi-tt-coolant-type",
  "https://alloemmanuals.com/tools/buick-enclave-spark-plug-type",
  "https://alloemmanuals.com/tools/honda-civic-oil-type",
  "https://alloemmanuals.com/tools/hyundai-venue-coolant-type",
  "https://alloemmanuals.com/guides",
  "https://alloemmanuals.com/tools/chevrolet-traverse-coolant-type",
  "https://alloemmanuals.com/tools/gmc-canyon-tire-size",
  "https://alloemmanuals.com/tools/volkswagen-beetle-spark-plug-type"
];

function submit(url) {
  return new Promise((resolve, reject) => {
    const encodedUrl = encodeURIComponent(url);
    const endpoint = `https://api.indexnow.org/IndexNow?url=${encodedUrl}&key=${key}`;
    
    https.get(endpoint, { headers: { 'User-Agent': 'AllOEMManuals-IndexNow/2.0' } }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 202) {
        resolve({ status: res.statusCode });
      } else {
        reject(new Error(`HTTP status ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  console.log(`Starting submission of ${urls.length} target URLs via IndexNow...`);
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const result = await submit(url);
      console.log(`[OK] (${result.status}) Submitted: ${url}`);
    } catch (e) {
      console.error(`[ERROR] Failed to submit ${url}: ${e.message}`);
    }
    // Delay between URLs
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  console.log('Submission complete!');
}

run();
