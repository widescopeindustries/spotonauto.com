import neo4j from 'neo4j-driver';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'spotonauto2026'));

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

async function getLemonExcerpts(args) {
  const session = driver.session();
  try {
    const normMake = args.make.toLowerCase().trim();
    const normModel = args.model.toLowerCase().replace(/\s+/g, '-').trim();
    const year = Number(args.year);
    const limit = args.limit || 3;

    // Filter keywords to substantive words
    const keywords = (args.keywords || [args.task.replace(/-/g, ' ')])
      .map(k => k.toLowerCase().trim())
      .filter(k => k.length > 2);

    const whereClauses = keywords
      .map((_, i) => `toLower(p.title) CONTAINS $kw${i} OR toLower(r.encodedPath) CONTAINS $kw${i}`)
      .join(' OR ');

    const params = {
      year: neo4j.int(year),
      make: normMake,
      model: normModel,
      limit: neo4j.int(limit * 2), // fetch extra to filter valid HTML
    };
    keywords.forEach((k, i) => {
      params[`kw${i}`] = k;
    });

    const query = `
      MATCH (v:Variant)<-[r:APPLIES_TO]-(p:Procedure)
      WHERE v.year = $year 
        AND toLower(v.make) = $make 
        AND (toLower(v.model) = $model OR toLower(v.model) CONTAINS $model OR $model CONTAINS toLower(v.model))
        ${whereClauses ? `AND (${whereClauses})` : ''}
      RETURN DISTINCT v.label AS variant, v.uriPath AS uriPath, p.title AS title, r.encodedPath AS encodedPath, p.source AS source
      LIMIT $limit
    `;

    const res = await session.run(query, params);
    const excerpts = [];

    for (const record of res.records) {
      if (excerpts.length >= limit) break;
      const r = record.toObject();
      if (!r.uriPath || !r.encodedPath) continue;

      const url = `http://127.0.0.1:8080${r.uriPath}Repair%20and%20Diagnosis/${r.encodedPath}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (resp.ok) {
          const html = await resp.text();
          const mainMatch = html.match(/<div class="main">([\s\S]*?)<\/div>\s*<div class="theme-colors footer">/i);
          const rawText = cleanHtmlToText(mainMatch ? mainMatch[1] : html);
          if (rawText.length > 60) {
            const preview = rawText.slice(0, 320).trim() + '...';
            const manualHref = `/manual${r.uriPath}Repair%20and%20Diagnosis/${r.encodedPath}`.replace(/\/+$/, '');
            excerpts.push({
              path: manualHref,
              make: args.make,
              year,
              model: args.model,
              sectionTitle: `${r.title} — ${r.variant}`,
              contentPreview: preview,
              manualHref,
            });
          }
        }
      } catch (err) {
        // skip failed fetch
      }
    }

    return excerpts;
  } finally {
    await session.close();
  }
}

async function main() {
  const tests = [
    { make: 'Toyota', year: 2020, model: 'Camry', task: 'oil-change', keywords: ['differential oil', 'engine oil', 'oil filter', 'oil'] },
    { make: 'Ford', year: 2021, model: 'f-150', task: 'battery-replacement', keywords: ['battery replacement', 'battery', 'charging'] },
    { make: 'Honda', year: 2019, model: 'Civic', task: 'brake-pad-replacement', keywords: ['brake pad', 'brake fluid', 'brakes'] },
    { make: 'Chevrolet', year: 2018, model: 'silverado-1500', task: 'brake-pad-replacement', keywords: ['brake', 'pedal', 'rotor'] },
  ];

  for (const t of tests) {
    console.log(`\n========================================`);
    console.log(`Testing: ${t.year} ${t.make} ${t.model} (${t.task})`);
    const results = await getLemonExcerpts(t);
    console.log(`Found ${results.length} excerpts:`);
    for (const r of results) {
      console.log(`- Section: ${r.sectionTitle}`);
      console.log(`  Manual Link: ${r.manualHref}`);
      console.log(`  Preview: ${r.contentPreview.slice(0, 150)}...`);
    }
  }

  await driver.close();
}

main().catch(console.error);
