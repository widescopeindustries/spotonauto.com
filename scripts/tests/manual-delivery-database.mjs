// Uses one private PostgreSQL connection and a rolled-back temporary table.
import assert from 'node:assert/strict';
import { getLocalPool, getChildSections, getSectionMetadataByPath } from '../../src/lib/manualEmbeddingsStore.ts';
const pool = getLocalPool();
assert.ok(pool);
assert.equal(pool.options.max, 1, 'Run this isolated fixture with MANUAL_DATABASE_POOL_MAX=1');
try {
  await pool.query('BEGIN');
  await pool.query(`CREATE TEMP TABLE manual_embeddings (
    path text PRIMARY KEY, make text NOT NULL, year integer NOT NULL, model text NOT NULL,
    section_title text NOT NULL, content_preview text NOT NULL, content_full text NOT NULL,
    embedding jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  ) ON COMMIT DROP`);
  for (let i = 0; i < 210; i++) {
    await pool.query(`INSERT INTO manual_embeddings(path,make,year,model,section_title,content_preview,content_full) VALUES($1,'Fixture',2020,'Model','A nested item','preview','full')`, ['/Fixture/2020/A%20B/Parent/Nested' + i + '/Deeper']);
  }
  for (const [path, title] of [['/Fixture/2020/A%20B/Parent/One', 'Z one'], ['/Fixture/2020/A%20B/Parent/Two', 'Z two'], ['/Fixture/2020/AXXXB/Parent/Other', 'Wrong vehicle']]) {
    await pool.query(`INSERT INTO manual_embeddings(path,make,year,model,section_title,content_preview,content_full) VALUES($1,'Fixture',2020,'Model',$2,$3,'must not transfer full content')`, [path, title, 'x'.repeat(500)]);
  }
  const children = await getChildSections('/Fixture/2020/A%20B/Parent');
  assert.deepEqual(children.map(row => row.sectionTitle), ['Z one', 'Z two']);
  assert.ok(children.every(row => row.contentFull === undefined && row.contentPreview.length === 160));
  assert.equal((await getChildSections('/Fixture/2020/A%20B/Parent')).length, 2);
  const row = await getSectionMetadataByPath(children[0].path);
  assert.equal(row.sectionTitle, 'Z one'); assert.equal(row.contentFull, undefined);
  console.log('PASS: literal encoded-percent matching, depth filtering before limit, metadata projection, exact metadata lookup. Temporary fixture rolled back.');
} finally {
  await pool.query('ROLLBACK');
  await pool.end();
}
