import { getLemonExcerptsForRepair } from '../src/lib/lemonExcerpts.ts';

async function test() {
  const cases = [
    { year: 2020, make: 'toyota', model: 'camry', task: 'oil-change' },
    { year: 2021, make: 'ford', model: 'f-150', task: 'battery-replacement' },
    { year: 2019, make: 'honda', model: 'civic', task: 'brake-pad-replacement' },
    { year: 2020, make: 'toyota', model: 'camry', task: 'brake-pad-replacement' },
    { year: 2017, make: 'nissan', model: 'altima', task: 'headlight-bulb-replacement' },
    { year: 2021, make: 'ram', model: '1500', task: 'oil-change' },
  ];

  for (const c of cases) {
    console.log(`\n========================================`);
    console.log(`Testing ${c.year} ${c.make} ${c.model} (${c.task}):`);
    const res = await getLemonExcerptsForRepair(c);
    console.log(`Result count: ${res.length}`);
    for (const item of res) {
      console.log(` - Title: ${item.sectionTitle}`);
      console.log(`   Link: ${item.manualHref}`);
      console.log(`   Preview: ${item.contentPreview.slice(0, 120)}...`);
    }
  }
}

test().catch(console.error);
