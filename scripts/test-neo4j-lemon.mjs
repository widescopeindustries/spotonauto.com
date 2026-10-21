import neo4j from 'neo4j-driver';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'spotonauto2026'));
const session = driver.session();

async function main() {
  try {
    const res = await session.run(
      `MATCH (v:Variant {year: 2020, make: "toyota", model: "camry"})<-[r:APPLIES_TO]-(p:Procedure)
       RETURN p.title AS title, r.encodedPath AS encodedPath, count(*) AS cnt
       LIMIT 10`
    );
    console.log('2020 Camry Procedures count:', res.records.length);
    for (const r of res.records) {
      console.log(' - Title:', r.get('title'));
      console.log('   Path:', decodeURIComponent(r.get('encodedPath')));
    }

    const countRes = await session.run(
      `MATCH (v:Variant {year: 2020, make: "toyota", model: "camry"})<-[:APPLIES_TO]-(p:Procedure)
       RETURN count(p) AS total`
    );
    console.log('Total 2020 Camry procedures:', countRes.records[0].get('total').toString());
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);
