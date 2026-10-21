async function verifyLiveHtml() {
  const urls = [
    'http://127.0.0.1:3002/repair/2021/ford/f-150/battery-replacement',
    'http://127.0.0.1:3002/repair/2019/honda/civic/brake-pad-replacement',
    'http://127.0.0.1:3002/repair/2020/toyota/camry/brake-pad-replacement',
    'http://127.0.0.1:3002/repair/2017/nissan/altima/headlight-bulb-replacement',
  ];

  for (const u of urls) {
    console.log(`\n========================================`);
    console.log(`Testing URL: ${u}`);
    const res = await fetch(u, { headers: { 'User-Agent': 'Googlebot/2.1' } });
    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    const html = await res.text();
    console.log(`HTML Length: ${html.length}`);
    
    const hasOemHeading = html.includes('The exact OEM answer for') || html.includes('Factory Service Manual');
    const hasOemBadge = html.includes('Verified OEM data');
    const hasManualLink = html.includes('/manual/');
    
    console.log(` - Has OEM Excerpt Heading? ${hasOemHeading}`);
    console.log(` - Has Verified OEM Badge? ${hasOemBadge}`);
    console.log(` - Has /manual/ link? ${hasManualLink}`);
    
    // Check for excerpt title snippet
    const match = html.match(/<h4 class="[^"]*text-base font-semibold text-white[^"]*">([^<]+)<\/h4>/i);
    if (match) {
      console.log(` - Rendered OEM Section Title: "${match[1]}"`);
    }
  }
}

verifyLiveHtml().catch(console.error);
