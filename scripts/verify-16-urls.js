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

async function verify() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const status = res.status;
      const hasNoindex = html.toLowerCase().includes('noindex');
      const hasRobots = html.toLowerCase().includes('name="robots"') || html.toLowerCase().includes('name=\'robots\'');
      
      let robotsContent = 'None';
      if (hasRobots) {
        const match = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i) || 
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/i);
        if (match) {
          robotsContent = match[1];
        } else {
          robotsContent = 'Found tag but could not parse content';
        }
      }
      
      console.log(`URL: ${url}`);
      console.log(`  Status: ${status}`);
      console.log(`  Robots tag content: ${robotsContent}`);
      console.log(`  Contains "noindex": ${hasNoindex}`);
      console.log('--------------------------------------------------');
    } catch (e) {
      console.error(`Error fetching ${url}: ${e.message}`);
      console.log('--------------------------------------------------');
    }
  }
}

verify();
