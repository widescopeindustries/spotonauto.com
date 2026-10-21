import neo4j from 'neo4j-driver';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'spotonauto2026'));
const session = driver.session();

function cleanHtmlToText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function getLemonExcerpt(make, year, model, keywords) {
  const whereClauses = keywords.map((k, i) => `toLower(p.title) CONTAINS $kw${i} OR toLower(r.encodedPath) CONTAINS $kw${i}`).join(' OR ');
  const params = {
    year: neo4j.int(year),
    make: make.toLowerCase(),
    model: model.toLowerCase().replace(/\s+/g, '-'),
  };
  keywords.forEach((k, i) => {
    params[`kw${i}`] = k.toLowerCase();
  });

  const query = `
    MATCH (v:Variant)<-[r:APPLIES_TO]-(p:Procedure)
    WHERE v.year = $year 
      AND toLower(v.make) = $make 
      AND (toLower(v.model) = $model OR toLower(v.model) CONTAINS $model)
      AND (${whereClauses})
    RETURN v.label AS variant, v.uriPath AS uriPath, p.title AS title, r.encodedPath AS encodedPath, p.source AS source
    LIMIT 2
  `;

  const res = await session.run(query, params);
  const results = [];
  for (const record of res.records) {
    const r = record.toObject();
    const url = `http://127.0.0.1:8080${r.uriPath}Repair%20and%20Diagnosis/${r.encodedPath}`;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const html = await resp.text();
        const mainMatch = html.match(/<div class="main">([\s\S]*?)<\/div>\s*<div class="theme-colors footer">/i);
        const text = cleanHtmlToText(mainMatch ? mainMatch[1] : html);
        results.push({
          title: r.title,
          variant: r.variant,
          manualPath: `/manual${r.uriPath}Repair%20and%20Diagnosis/${r.encodedPath}`,
          preview: text.slice(0, 350) + '...',
        });
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
  }
  return results;
}

async function main() {
  try {
    const excerpts2020 = await getLemonExcerpt('Toyota', 2020, 'Camry', ['oil', 'filter']);
    console.log('2020 Toyota Camry Oil Excerpts:');
    console.log(JSON.stringify(excerpts2020, null, 2));

    const excerpts2021 = await getLemonExcerpt('Ford', 2021, 'F-150', ['battery']);
    console.log('\n2021 Ford F-150 Battery Excerpts:');
    console.log(JSON.stringify(excerpts2021, null, 2));
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);
