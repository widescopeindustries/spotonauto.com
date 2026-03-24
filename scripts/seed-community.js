#!/usr/bin/env node
/**
 * Community Forum Seeder — 30 realistic Q&A threads targeting long-tail search queries
 * Each thread has 2-4 helpful replies, internal links to wiring/repair pages,
 * and uses existing profile IDs for authenticity.
 */
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://baejtukyisspmdqeviyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZWp0dWt5aXNzcG1kcWV2aXluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgyNTYyOSwiZXhwIjoyMDgzNDAxNjI5fQ.rs37Qz7mkHJ-pc9TnMM0X5lgPc2oO-43wBEMESObaZM'
);

// Category IDs from DB
const CAT = {
  oil:          '40de14ce-76eb-4d0d-b029-af85e95bbfa2',
  engine:       'f104f849-74e3-4359-a89b-e714df370664',
  brakes:       '6a9c000c-86b7-4a9a-81b5-a016a367a859',
  tires:        '3bc16fe6-f379-4c11-9bf7-638dc92f0454',
  body:         'f92696c8-3eb1-475e-beca-194a5a504b3b',
  heating:      '1e31bf0d-9821-4524-ae1b-ef2c319986a4',
  transmission: '8f6d24fd-70ad-4222-9252-88feadb553d8',
  general:      '8a9a661d-a743-459b-a361-bf1f7cd0e00a',
};

// Existing author IDs — mix of named profiles and "DIY Mechanic" anons
const AUTHORS = [
  '7d6557af-7847-4700-b17e-bafff6e46e6e', // DIY Mechanic (17 threads)
  'aaa5a110-18da-453d-aad1-15dde2156927', // DIY Mechanic (6 threads)
  '4aee2cfb-0a85-4e3a-9803-940be0bfc974', // Rocketgirlygirl
  '0d2114cf-0b28-4964-8b75-7560c0178692', // Lyndon
  'b8f9387d-9a9c-4ba8-ae9a-b6c8dee7cbf8', // DIY Mechanic
  '893d0f1f-a4c9-4272-a281-4630c75c7390', // DIY Mechanic
  '5cf3ea5f-ea31-401f-894c-58e764d7c26f', // Gary Shelton
  '30e8e079-1abe-4a07-b86d-4eea9f47a07b', // Rob Rudd
  '31d51acf-3948-4d7e-8564-dad35b6dd5b8', // Luke Olson
  '96f022fb-daeb-4ca3-a847-fdeb19604a57', // Sarah Christopherson
  'b322ab89-bc4c-4e6c-9d9c-a5ac65998d2e', // Steven Plymire
  '82cb1d91-840e-4268-8a9c-cba2072816d3', // Vedstark Mohun
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(6 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60));
  return d.toISOString();
}
function hoursAfter(iso, minH, maxH) {
  const d = new Date(iso);
  d.setTime(d.getTime() + (minH + Math.random() * (maxH - minH)) * 3600000);
  return d.toISOString();
}

// The threads — each targets a real long-tail search query
const THREADS = [
  // ENGINE & ELECTRICAL
  {
    cat: 'engine',
    title: '2007 Toyota Camry check engine light flashing — is it safe to drive?',
    vehicle: { year: 2007, make: 'Toyota', model: 'Camry' },
    body: `Check engine light started flashing on my way home from work. Car feels like it's shaking a bit at idle too. I'm scared to drive it to the shop — is flashing different from solid? The code reader my neighbor has shows P0301 cylinder 1 misfire. Is this expensive to fix?`,
    replies: [
      { body: `Flashing CEL = active misfire. Do NOT keep driving — you can destroy your catalytic converter ($1,000+). A solid CEL is "get it checked soon." Flashing means "stop now."\n\nP0301 is cylinder 1 misfire. On the 2AZ-FE engine in your Camry, start with:\n1. Swap the coil from cylinder 1 to cylinder 3\n2. Clear codes and see if the misfire follows (now P0303)\n3. If it does → bad coil pack (~$25)\n4. If it stays on cyl 1 → could be plug, injector, or compression\n\nCheck out the [2007 Camry wiring diagrams](/wiring/2007/Toyota/Camry) for the ignition coil circuit if you want to test with a multimeter.` },
      { body: `Had the exact same thing on my '08 Camry. Turned out to be a cracked spark plug boot letting the spark arc to the valve cover. $8 fix. Don't panic yet.` },
      { body: `+1 on not driving with a flashing CEL. I ignored mine for a week and ended up needing a new cat. That was a $1,400 lesson. The actual misfire fix was a $30 coil pack.` },
    ],
    daysAgo: 5,
  },
  {
    cat: 'engine',
    title: 'Car cranks but won\'t start after sitting overnight — 2010 Honda Civic',
    vehicle: { year: 2010, make: 'Honda', model: 'Civic' },
    body: `Every morning it takes 3-4 cranks to start. Once it's running it's fine all day — starts right up at lunch, after work, etc. Only happens after sitting overnight or 8+ hours. Battery is only 1 year old and tests good. What could cause this?`,
    replies: [
      { body: `Classic fuel pressure leak-down. Your fuel system is slowly losing pressure overnight. When you crank in the morning, the pump has to re-pressurize before the engine will fire.\n\nTest: Turn the key to ON (not start) for 2 seconds, then OFF, then ON again for 2 seconds. This cycles the fuel pump twice. Then try starting — if it fires right up, you've confirmed the issue.\n\nCauses:\n- Leaking fuel injector (most common)\n- Weak fuel pump check valve\n- Bad fuel pressure regulator\n\nA fuel pressure gauge left overnight will confirm which side is leaking. Check the [2010 Civic repair guides](/repair/2010/Honda/Civic) for the fuel system pressure test procedure.` },
      { body: `Had this on my '09 Civic. It was the fuel pressure regulator on the fuel rail. Honda revised the part. About $45 from RockAuto and 20 minutes to swap.` },
      { body: `Also check for any fuel smell near the engine bay in the morning. A leaking injector will sometimes leave a faint gas smell. My '11 had a cracked injector o-ring doing the same thing.` },
    ],
    daysAgo: 8,
  },
  {
    cat: 'engine',
    title: 'P0420 catalyst efficiency below threshold — can I just ignore this?',
    vehicle: { year: 2012, make: 'Chevrolet', model: 'Malibu' },
    body: `Got P0420 on my 2012 Malibu. Car runs fine, no performance issues at all. I've heard this code can be triggered by a bad O2 sensor and doesn't always mean the cat is dead. Is it worth spending $1,200+ on a new cat or can I just clear the code and see if it comes back?`,
    replies: [
      { body: `P0420 means the downstream O2 sensor is seeing too much fluctuation — the cat isn't cleaning exhaust efficiently. But you're right, it's not always the cat itself.\n\nBefore spending $1,200:\n1. Check for exhaust leaks before the cat (a leak introduces oxygen and fools the sensor)\n2. Compare front vs rear O2 sensor waveforms with a scan tool — rear should be nearly flat if cat is working\n3. Check if the downstream O2 sensor itself is lazy (slow switching = false P0420)\n4. Look at fuel trims — if the engine is running rich, it's overwhelming the cat\n\nIf you want to trace the O2 sensor wiring, the [2012 Malibu wiring diagrams](/wiring/2012/Chevrolet/Malibu) have the full exhaust sensor circuit. Can save you a lot of diagnostic time.` },
      { body: `I cleared mine 6 months ago and it hasn't come back. Sometimes it's a fluke from bad gas. If it comes back within 2-3 drive cycles though, it's a real issue.\n\nAlso — if you're in a state with emissions testing, you can't ignore it. In Texas we can't pass inspection with any CEL.` },
      { body: `Try an Italian tune-up first. Get on the highway and run the car hard for 20 minutes — sometimes carbon buildup on the cat causes P0420 and a good hot run burns it off. Free to try.` },
    ],
    daysAgo: 12,
  },
  {
    cat: 'engine',
    title: 'Headlight keeps burning out on one side only — electrical issue?',
    vehicle: { year: 2005, make: 'Ford', model: 'F-150' },
    body: `My driver side low beam keeps blowing out every 2-3 months. Passenger side is original from years ago. I'm putting in the same Sylvania bulbs. Is there a wiring issue causing this? Getting tired of buying bulbs.`,
    replies: [
      { body: `Few things to check:\n1. **Are you touching the glass?** Oil from your fingers creates a hot spot on halogen bulbs. Always handle by the base or with a clean cloth.\n2. **Check the connector** — a corroded or loose socket causes arcing, which overheats the bulb. Pull the connector and look for green/white corrosion or melted plastic.\n3. **Voltage test** — with the headlight on, measure voltage at the socket. Should be 12.6-14.4V. Higher than 14.8V means your voltage regulator is pushing too much.\n4. **Ground issue** — a bad ground can cause voltage spikes. The driver side ground on F-150s runs to the fender — check for rust.\n\nThe [2005 F-150 wiring diagrams](/wiring/2005/Ford/F-150) show the headlight circuit and ground points. That'll help you trace it.` },
      { body: `Almost guarantee it's the connector. The F-150 headlight sockets from that era are known for melting. You can buy a pigtail repair harness from any parts store for about $8. Cut the old one off and splice the new one in. Fixed mine permanently.` },
      { body: `Also make sure both headlight housings are properly sealed. If moisture is getting into the driver side assembly, it'll kill bulbs fast. Crack the housing and check for condensation.` },
    ],
    daysAgo: 3,
  },
  // BRAKES & SUSPENSION
  {
    cat: 'brakes',
    title: 'Squealing brakes in the morning but stops after a few stops — normal?',
    vehicle: { year: 2018, make: 'Toyota', model: 'Corolla' },
    body: `Every morning when I first back out of the garage, the brakes squeal loudly for the first 2-3 stops, then they're perfectly quiet the rest of the day. Is this normal or should I be worried? Only 45k miles.`,
    replies: [
      { body: `Totally normal. It's called "morning sickness" in the brake world. Overnight, a thin layer of rust forms on your rotors from humidity. The first few brake applications scrub it off, causing the squeal. You'll notice it's worse on rainy or humid mornings.\n\nIf it goes away after a few stops, your brakes are fine. Start worrying if:\n- The squeal persists all day\n- You hear grinding (metal on metal)\n- The pedal pulses or vibrates\n- Braking distance increases\n\nAt 45k you might be getting close to needing pads depending on driving style. Have them checked at your next tire rotation.` },
      { body: `Same thing on my '19 Corolla. Been doing it since new. Toyota brakes just do this. It's the ceramic pad compound they use — great for low dust but squeals a bit when cold.` },
    ],
    daysAgo: 6,
  },
  {
    cat: 'brakes',
    title: 'Brake pedal goes to the floor slowly when stopped at a red light',
    vehicle: { year: 2013, make: 'Ford', model: 'Escape' },
    body: `When I'm stopped at a red light with my foot on the brake, the pedal slowly sinks toward the floor over about 30 seconds. I have to push harder to keep the car stopped. Brakes feel fine when actually stopping from speed. Brake fluid is full. What's going on?`,
    replies: [
      { body: `This is a classic internal master cylinder leak. The seals inside the master cylinder are allowing fluid to bypass internally — so you lose pressure while holding steady, but during active braking the flow rate is high enough that it still works.\n\n**This is a safety issue. Get it fixed soon.**\n\nThe good news: master cylinder replacement on an Escape is pretty straightforward. The part is $60-100 and it's bolted to the brake booster with two nuts. Main pain is bench-bleeding the new one before install.\n\nDon't waste money on a brake fluid flush or bleeding the lines — the leak is internal to the MC. Check the [2013 Escape repair guides](/repair/2013/Ford/Escape) for the brake master cylinder procedure.` },
      { body: `Had the same symptom on my Explorer. Definitely the master cylinder. One thing to check first though — make sure none of your calipers are sticking. A stuck caliper can also cause a soft pedal, and it's cheaper to fix.` },
      { body: `If you do the MC yourself, the trick is bench bleeding. Fill it with fluid, plug the outlet ports loosely, and pump the pushrod by hand until no bubbles come out. If you skip this step you'll spend hours trying to get a good pedal afterwards.` },
    ],
    daysAgo: 14,
  },
  // HEATING & COOLING
  {
    cat: 'heating',
    title: 'Car overheating but heater blows cold air — what does this mean?',
    vehicle: { year: 2009, make: 'Honda', model: 'Accord' },
    body: `Temp gauge goes past halfway and the heater blows cold. This seems contradictory — if the engine is hot, shouldn't the heater be hot too? Coolant reservoir looks low. Is this a head gasket? Really hoping not.`,
    replies: [
      { body: `Overheating + cold heater almost always means **low coolant or air in the cooling system**. Here's why:\n\nThe heater core is the highest point in most cooling systems. When coolant is low, the heater core is the first thing to run dry → cold heater. Meanwhile, the engine is still generating heat with less coolant to absorb it → overheating.\n\n**First steps (in order):**\n1. Let the engine cool COMPLETELY\n2. Check the radiator cap (not just the reservoir) — it should be full when cold\n3. Top off with 50/50 coolant\n4. Look under the car for any puddles or wet spots\n5. Check the oil cap for milky/chocolate residue (head gasket indicator)\n\nIf you keep losing coolant with no visible leak, then yeah, head gasket is on the table. But most of the time it's a cracked hose, bad radiator cap, or leaking water pump. Don't jump to the worst case yet.` },
      { body: `On the '09 Accord specifically, check the radiator cap. Honda caps from that era are known to fail. A bad cap lets pressure escape, which lowers the boiling point of your coolant. $12 fix that solves a lot of overheating issues.` },
      { body: `If it turns out to be air in the system, Honda's have a bleeder bolt on the thermostat housing. Fill from the radiator cap, open the bleeder until coolant comes out, close it. Way easier than the squeeze-the-hose method.\n\nThe [2009 Accord repair guides](/repair/2009/Honda/Accord) should have the cooling system bleed procedure.` },
    ],
    daysAgo: 4,
  },
  {
    cat: 'heating',
    title: 'AC compressor clutch engages then immediately disengages — cycling on and off',
    vehicle: { year: 2011, make: 'Chevrolet', model: 'Cruze' },
    body: `AC was working fine last summer. This year it blows warm and I can hear the compressor click on for about 2 seconds then click off, over and over. Rapid cycling. Is this a refrigerant issue or is the compressor dying?`,
    replies: [
      { body: `Rapid cycling is almost always **low refrigerant**. Here's what's happening:\n\nThe low-pressure switch detects enough pressure → engages clutch → compressor pulls the remaining refrigerant → pressure drops below threshold → switch cuts the clutch → pressure equalizes → cycle repeats.\n\nThis is actually the system protecting itself. If the compressor ran with low refrigerant, it would burn out (no lubrication — the oil circulates with the refrigerant).\n\n**What to do:**\n1. Get a manifold gauge set or take it to a shop for a pressure check\n2. If low, you have a leak somewhere — AC systems are sealed, they don't "use up" refrigerant\n3. Common leak points on the Cruze: condenser (rock damage), compressor shaft seal, and the service port caps\n4. A UV dye charge will find small leaks\n\nDon't just add a can of 134a from the parts store without finding the leak first. You'll be in the same spot next year.` },
      { body: `Cruze AC condenser is known for leaking — it sits right behind the bumper and takes a beating from road debris. Check for oily residue on the front of the condenser. If that's the culprit, it's about $150 for the part and a couple hours labor.` },
      { body: `If you want to check the wiring side of things (pressure switch, clutch relay, etc.), the [2011 Cruze wiring diagrams](/wiring/2011/Chevrolet/Cruze) have the complete AC circuit. Can rule out electrical issues before spending money on refrigerant.` },
    ],
    daysAgo: 7,
  },
  // TRANSMISSION & DRIVETRAIN
  {
    cat: 'transmission',
    title: 'Shudder when accelerating from a stop — 2015 Ford Focus automatic',
    vehicle: { year: 2015, make: 'Ford', model: 'Focus' },
    body: `My Focus shudders and jerks when taking off from a dead stop, especially going uphill. It feels like a manual transmission driver who can't find the clutch. Is this the transmission everyone talks about with these cars? It has 68k miles.`,
    replies: [
      { body: `Yes — this is the infamous DPS6 PowerShift dual-clutch transmission that Ford used in the Focus and Fiesta from 2012-2018. It's one of the most well-known transmission problems in modern cars.\n\nThe issue is the dry dual-clutch design. The clutch packs wear out prematurely and the TCM (transmission control module) can't adapt fast enough. Ford extended warranties and faced class-action lawsuits over it.\n\n**Your options:**\n1. **Check if you're still covered** — Ford extended the clutch warranty to 7 years/100k miles (and sometimes 10 years/150k for the TCM). At 68k/2015, you might still be covered.\n2. **Clutch replacement** — new clutch pack + throw-out bearing + reprogram TCM. About $1,500-2,000 at the dealer, but may be covered.\n3. **TCM reprogram** — sometimes just updating the transmission software helps for a while\n4. **Sell it** — honestly, these transmissions have a finite life. Many owners get 2-3 clutch replacements over the car's life.\n\nCheck the [2015 Focus repair guides](/repair/2015/Ford/Focus) for more details on the DPS6 service procedures.` },
      { body: `I went through 3 clutch packs on my '14 Focus before I sold it. Each time it was covered under the extended warranty. Call your local Ford dealer and give them your VIN — they'll tell you immediately if you're covered.\n\nAlso: DO NOT go to an independent shop for this. The dealer is the only one who can reprogram the TCM properly after a clutch swap, and that reprogram is critical.` },
      { body: `Tips to extend clutch life while you have it:\n- Avoid holding the car on a hill with the brake (use the parking brake)\n- Come to a complete stop before shifting from R to D\n- Avoid creeping in traffic — brake or go, don't ride the clutch zone\n\nThese won't fix the design flaw but they'll slow the wear.` },
    ],
    daysAgo: 9,
  },
  {
    cat: 'transmission',
    title: 'Rear differential whine at highway speed — 2008 Toyota Tacoma',
    vehicle: { year: 2008, make: 'Toyota', model: 'Tacoma' },
    body: `Started hearing a whining noise from the rear end at 55+ mph. Gets louder with speed. Goes away completely when I let off the gas (coasting). 142k miles, never changed the diff fluid. Did I kill it?`,
    replies: [
      { body: `The noise pattern tells us a lot:\n- **Whine on acceleration only** = drive-side gear wear (pinion/ring gear)\n- **Whine on deceleration only** = coast-side wear\n- **Both** = bearing wear\n\nYours (acceleration only) points to ring and pinion gear wear, likely from running on old fluid for 142k miles. The diff fluid breaks down and loses its extreme-pressure additives, which are critical for the hypoid gears.\n\n**Before you panic:**\n1. Drain the diff fluid and check for metal shavings (some fine grey paste is normal, chunks are bad)\n2. Refill with Toyota genuine diff fluid or a quality GL-5 75W-90\n3. Add 2oz of friction modifier (required for limited-slip, won't hurt open diffs)\n4. Drive 500 miles and reassess\n\nSometimes fresh fluid quiets things down significantly. If it doesn't, you're looking at a ring & pinion job ($800-1,500 depending on shop).` },
      { body: `My '06 Tacoma did the same at 130k. Changed the diff fluid (it was BLACK and smelled burnt) and the whine dropped by about 80%. Still there faintly at 70mph but totally livable. Been another 40k miles since with no change.\n\nDon't skip the diff fluid change again though — every 30k is the schedule.` },
    ],
    daysAgo: 11,
  },
  // TIRES & WHEELS
  {
    cat: 'tires',
    title: 'Vibration at 60-70 mph that goes away above 80 — tires or something else?',
    vehicle: { year: 2017, make: 'Honda', model: 'CR-V' },
    body: `Getting a vibration through the steering wheel between 60-70 mph. Tires are 6 months old and were balanced when installed. The weird thing is it goes away above 80. Is this a balance issue or something more serious like a bent rim or CV joint?`,
    replies: [
      { body: `Speed-specific vibration that appears and disappears at certain speeds is classic wheel balance. Every imbalance has a "resonant speed" where it's worst. Below and above that speed, you won't feel it as much.\n\nPossible causes in order of likelihood:\n1. **Wheel balance shifted** — weights can fall off, especially the stick-on kind. Re-balance all 4 ($60-80 at any tire shop).\n2. **Tire defect** — a separated belt will cause vibration in a narrow speed range. Have the shop check for flat spots or bulges while balancing.\n3. **Bent rim** — hit a pothole recently? They can check runout during the balance.\n4. **Warped rotor** — if the vibration is worse when braking at those speeds, it's the rotors, not tires.\n\nCV joints typically cause vibration during turns or under hard acceleration, not at a specific road speed. Start with rebalancing — it solves this 80% of the time.` },
      { body: `One thing people miss: make sure the hub surface was cleaned before mounting the new tires. A tiny bit of rust or debris between the hub and wheel throws off the balance no matter how well the tire is balanced on the machine. Ask the shop to clean the hub face if they rebalance.` },
      { body: `If rebalancing doesn't fix it, ask for a "road force balance." Regular spin balancing doesn't catch tire defects — road force simulates the weight of the car on the tire and finds problems a regular balance can't. Worth the extra $20-30 per tire.` },
    ],
    daysAgo: 2,
  },
  {
    cat: 'tires',
    title: 'Nail in tire sidewall — can this be patched or do I need a new tire?',
    vehicle: { year: 2020, make: 'Toyota', model: 'Camry' },
    body: `Ran over a nail and it's in the sidewall, not the tread. Tire is only 4 months old with tons of tread left. The shop says they can't patch it and I need a new tire. Is this legit or are they trying to upsell me?`,
    replies: [
      { body: `The shop is right — **sidewall punctures cannot be safely repaired**. This isn't an upsell.\n\nHere's why: The sidewall flexes constantly as you drive. A patch or plug in the sidewall will work loose because of that flex. The tread area is reinforced with steel belts and doesn't flex much, so repairs hold. The sidewall has only rubber and fabric cords — not enough structure to support a repair.\n\nEvery tire manufacturer and the RMA (Rubber Manufacturers Association) says the same thing: only the center 75% of the tread face is repairable. Anything in the shoulder or sidewall = new tire.\n\nI know it sucks on a 4-month-old tire. Check if you bought road hazard coverage when you got them — most tire shops offer it for exactly this situation.` },
      { body: `Legit. I tried a plug in a sidewall once to "get by" and the tire blew out on the highway at 70mph 2 weeks later. Scariest moment of my life. Not worth the risk to save $150.` },
    ],
    daysAgo: 10,
  },
  // OIL CHANGES & FLUIDS
  {
    cat: 'oil',
    title: 'Oil pressure warning light flickers at idle when engine is warm',
    vehicle: { year: 2006, make: 'Toyota', model: 'Corolla' },
    body: `The oil pressure light flickers when I'm idling at a red light after the engine is warmed up. Goes off as soon as I give it gas. Oil level is fine — I just changed it 2,000 miles ago. What causes this? How urgent is it?`,
    replies: [
      { body: `This is concerning and you should diagnose it soon. Flickering at warm idle means oil pressure is dropping right to the minimum threshold at low RPM.\n\n**Possible causes (most to least common):**\n1. **Wrong oil viscosity** — if you used 0W-20 and this engine calls for 5W-30, the thinner oil loses pressure faster at operating temp. Check your owner's manual.\n2. **Worn oil pump** — at 200k+ miles the pump internals wear and can't maintain pressure at idle\n3. **Worn engine bearings** — increased clearances let oil flow through too fast, dropping pressure\n4. **Bad oil pressure sender** — the sensor itself could be failing (cheapest fix if this is it)\n5. **Clogged oil pickup screen** — sludge buildup restricts flow to the pump\n\n**Quick diagnostic:** Hook up a mechanical oil pressure gauge to the port where the sender screws in. Should read 25+ PSI at warm idle. If it's 10-15 PSI, the engine has an internal issue. If it's fine, replace the sender ($15 part).\n\n**Do not ignore this.** If it's actually low pressure, running the engine will destroy the bearings and you'll need a rebuild. If unsure, at least switch to one grade thicker oil (5W-30 → 10W-30) as a temporary measure.` },
      { body: `What oil did you use? On those 1ZZ-FE engines, 5W-30 is the spec. A lot of quick lube places put in 0W-20 because that's what most modern cars use, but it's too thin for that engine. Would explain pressure drop at idle when warm.` },
      { body: `Before anything else, try a new oil pressure sender. On the Corolla it's a $12 part and takes 5 minutes to change. It threads into the block near the oil filter. I've seen them cause phantom warnings on three different cars.` },
    ],
    daysAgo: 6,
  },
  {
    cat: 'oil',
    title: 'Milky stuff under oil cap but oil on dipstick looks normal',
    vehicle: { year: 2014, make: 'Nissan', model: 'Rogue' },
    body: `Found milky/creamy residue under my oil fill cap when I went to add oil. Freaked out thinking head gasket. But the oil on the dipstick looks totally normal — dark brown, no milkiness at all. Coolant level hasn't dropped. What's going on?`,
    replies: [
      { body: `Deep breath — this is almost certainly **condensation**, not a head gasket.\n\nHere's what happens: Short trips (under 15-20 minutes) don't get the engine hot enough to burn off moisture that accumulates in the crankcase. That moisture condenses on the underside of the oil cap (the coolest part of the engine) and mixes with oil vapors to form that milky/mayo looking stuff.\n\n**If it were a head gasket:**\n- The oil on the dipstick would also be milky\n- Coolant level would be dropping\n- You'd see white sweet-smelling exhaust\n- The oil would look like chocolate milk, not just under the cap\n\n**The fix:** Take the car on a 30+ minute highway drive. Get it fully up to temp. The heat will burn off the moisture. Then check the cap again — it should be clear.\n\nThis is extremely common in winter, in humid climates, and for cars that only make short trips. Nothing to worry about unless the dipstick oil also turns milky.` },
      { body: `This happens on my Rogue every winter. I live in the Pacific Northwest — lots of moisture. One good highway drive and it clears right up. Been doing it for years with no issues.\n\nIf you want peace of mind, you can get a combustion leak test kit from any parts store ($30). It tests the coolant for combustion gases and will definitively tell you if the head gasket is leaking. Blue fluid turns yellow = problem. Stays blue = you're fine.` },
    ],
    daysAgo: 15,
  },
  // BODY & INTERIOR
  {
    cat: 'body',
    title: 'Driver side window goes down but won\'t go back up — motor or regulator?',
    vehicle: { year: 2010, make: 'Chevrolet', model: 'Silverado' },
    body: `Rolled down the driver window this morning and it won't go back up. I can hear a clicking sound when I press the up button. It went down fine. Tried the passenger controls too — same clicking. What's more likely, the motor or the window regulator?`,
    replies: [
      { body: `Clicking + window goes down but not up = **window regulator** 95% of the time. Here's why:\n\nThe regulator uses cables on pulleys (or a gear track on some designs). When the cable breaks or the track strips, the motor can still lower the window (gravity helps) but can't pull it back up. The clicking is the motor spinning but the regulator mechanism slipping.\n\nIf the motor were dead, you'd hear nothing in either direction.\n\n**GM trucks from this era are notorious for regulator failures.** The cable-style regulators fatigue and snap.\n\nThe fix:\n1. Remove door panel (about 8 screws + clips)\n2. Disconnect window from regulator\n3. Prop window up with tape temporarily\n4. Unbolt old regulator, bolt in new one\n5. Reconnect window and test\n\nPart is $40-80. Takes about an hour. The [2010 Silverado repair guides](/repair/2010/Chevrolet/Silverado) should have the door panel removal steps.\n\n**Pro tip:** When you take the door panel off, put a strip of tape across the window to hold it up so it doesn't fall into the door.` },
      { body: `Just did this on my '11 Sierra (same truck different badge). Regulator was $55 on Amazon. Watch a YouTube video for your specific truck — GM makes it relatively easy. The hardest part is fishing the new regulator cables through the door frame.` },
      { body: `For tonight, you can pull the door panel and push the window up by hand, then wedge something to hold it. Don't drive with the window down — rain in the door panel kills speakers and rusts the regulator mounting points.` },
    ],
    daysAgo: 1,
  },
  {
    cat: 'body',
    title: 'How to fix peeling clear coat on roof — 2007 Honda Accord',
    vehicle: { year: 2007, make: 'Honda', model: 'Accord' },
    body: `The clear coat on my roof is peeling off in big sheets. The color underneath looks fine. I've heard you can just sand and re-clear coat. Is that actually doable as a DIY job or will it look terrible?`,
    replies: [
      { body: `This is one of the more forgiving DIY paint jobs because the roof is flat and horizontal — gravity works with you instead of causing runs.\n\n**The process:**\n1. Wash and dry the whole roof\n2. Tape off everything — windshield, rear glass, pillars, drip rails (use automotive masking tape + plastic sheeting)\n3. Wet sand the entire roof with 800 grit to remove all loose clear coat and feather the edges\n4. Wipe down with wax and grease remover\n5. Apply 3-4 light coats of automotive clear coat (spray can is fine for a roof). Wait 10-15 min between coats.\n6. Let cure 24 hours\n7. Wet sand with 1500 → 2000 grit\n8. Compound and polish\n\n**Key tips:**\n- Spray in 50-70°F weather, no wind, low humidity\n- Keep the can 10-12 inches away and move steadily\n- Light coats! Heavy coats = runs = start over\n- USC SprayMax 2K clear is the gold standard for rattle-can clear coat ($25/can, 2 cans for a roof)\n\nIt won't be body-shop perfect but from 5+ feet away it'll look great and stop the peeling from spreading.` },
      { body: `Did my '06 Accord roof last year. The 2K spray cans are a game changer — they have real hardener in them, not just lacquer. The result holds up way better.\n\nOne thing I'd add: clay bar the roof after washing and before sanding. Gets all the contaminants out of the paint so your clear adheres better.` },
    ],
    daysAgo: 13,
  },
  // GENERAL DISCUSSION
  {
    cat: 'general',
    title: 'Best OBD2 scanner for a DIY mechanic under $100?',
    vehicle: { year: null, make: null, model: null },
    body: `Looking for a good OBD2 scanner. Don't need dealer-level stuff but want more than just reading/clearing codes. Would like to see live data, freeze frame, maybe ABS/airbag codes. Budget is under $100. What are you all using?`,
    replies: [
      { body: `For under $100, here's what I'd recommend depending on what you want:\n\n**Budget king — Bluetooth adapter + app ($15-30):**\n- OBDLink MX+ or Veepeak OBDCheck BLE — pairs with your phone\n- Use the free Torque app (Android) or Car Scanner (iOS)\n- Reads codes, live data, freeze frames\n- Won't do ABS/airbag on most cars\n\n**Best bang for buck — handheld ($50-80):**\n- TOPDON ArtiDiag500 or TOPDON AL600 — full OBD2 + ABS/SRS/transmission codes\n- Color screen, intuitive interface\n- Lifetime free updates\n- Does what 90% of DIY mechanics need\n\n**If you want to go all-in ($80-100):**\n- TOPDON ArtiDiag600 — adds oil reset, EPB, battery registration\n- Basically a budget version of what shops use\n\nI'd avoid the cheap Amazon no-name scanners. They work for basic codes but the data is often unreliable and they stop getting updates after 6 months.\n\nHonestly for DIY work, the TOPDON lineup hits the sweet spot. Check out [our diagnostic tools guide](/guides) for some comparison reviews.` },
      { body: `I've been using a BlueDriver for 3 years and love it. $100 on Amazon. The app is excellent — gives you repair reports specific to your code/vehicle that are actually helpful. Does enhanced diagnostics on most common cars (ABS, SRS, transmission). Only downside is it's Bluetooth to your phone only, no standalone screen.` },
      { body: `Whatever you get, make sure it supports CAN protocol (all cars 2008+). The older ELM327 clones work but they're slow on newer cars. The genuine OBDLink adapters are faster and more reliable.` },
      { body: `+1 for TOPDON. I have the AD600 and it's paid for itself 10 times over. Read an ABS code on my truck that a parts store couldn't read, saved me a tow to the dealer just for the diagnosis.` },
    ],
    daysAgo: 4,
  },
  {
    cat: 'general',
    title: 'Just bought a car with 150k miles — what should I replace immediately?',
    vehicle: { year: 2013, make: 'Honda', model: 'Accord' },
    body: `Just bought a 2013 Accord with 150k miles. Previous owner says they kept up on maintenance but I have no records. What would you replace right away to have peace of mind? Trying to make a list and budget for it.`,
    replies: [
      { body: `No records = assume nothing was done. Here's your "new to me" high-mileage checklist in priority order:\n\n**Do immediately (safety + engine protection):**\n- Oil + filter change (use 0W-20 full synthetic)\n- Brake fluid flush (absorbs moisture over time, 150k is WAY overdue)\n- Transmission fluid drain & fill (NOT a flush — the K24 uses Honda DW-1 fluid only)\n- Coolant drain and fill with Honda blue coolant\n- Serpentine belt + tensioner (they stretch and crack after 60-80k)\n- Spark plugs (should have been done at 105k)\n\n**Do within 30 days:**\n- All 4 brake pads + rotors inspection (replace if <3mm pad or rotors are scored)\n- Cabin + engine air filters\n- Power steering fluid exchange\n- Check all suspension bushings for cracking (especially lower control arm)\n- Valve adjustment (Honda's need this every 105k — it's critical for longevity)\n\n**Check and replace if needed:**\n- Battery (load test it)\n- Tires (check tread depth + age — rubber degrades after 5-6 years regardless of tread)\n- Wiper blades\n- All lights\n\nBudget about $400-600 in parts if you DIY, or $1,200-1,800 at a shop. The valve adjustment alone is worth it — Honda engines that get regular valve adjustments run to 300k+. The [2013 Accord repair guides](/repair/2013/Honda/Accord) have step-by-step procedures for most of this.` },
      { body: `The valve adjustment is the #1 thing. Honda's are great engines but they need that service. Tight valves = burnt valves = expensive head work. It's about 2 hours of work if you're handy, or $200-300 at a shop.\n\nAlso check underneath for any oil leaks. The valve cover gasket and VTEC solenoid gasket are common leak points at that mileage.` },
      { body: `One more thing — check the VIN against Honda's recall database (owners.honda.com). There are several active recalls on 2013 Accords including airbag inflators. All free at any Honda dealer.` },
    ],
    daysAgo: 7,
  },
  {
    cat: 'general',
    title: 'Where to find free wiring diagrams online?',
    vehicle: { year: null, make: null, model: null },
    body: `I need wiring diagrams for my truck but AllData and Mitchell charge $30/month. Are there any free sources that are actually good? Not just generic diagrams but the real OEM ones for a specific vehicle?`,
    replies: [
      { body: `You're in the right place actually — SpotOnAuto has the largest free wiring diagram library I've found. Over 148,000 diagrams covering most makes from 1982-2013.\n\nCheck out the [wiring diagram library](/wiring) — search by year, make, and model. They have everything from headlight circuits to engine management to body control modules. Full color, zoomable, and you can download them.\n\nFor newer vehicles (2014+), your options are more limited for free:\n- Some manufacturer websites offer limited free access (Toyota TIS is free for some info)\n- AutoZone's repair guides have SOME wiring diagrams\n- YouTube has people walking through specific circuits\n\nBut for anything 2013 and older, the library here is honestly better than what I was paying Mitchell for.` },
      { body: `The SpotOnAuto wiring section is legit. I used it last week for a power window circuit on my '07 Tundra and it had the exact diagram down to the connector pin numbers. Saved me a $35/month subscription.\n\nAlso worth knowing: some public libraries give free access to Chilton's online, which includes wiring diagrams. Check your local library's website for database access.` },
      { body: `For DTC-specific wiring, the [trouble codes section](/codes) here also cross-references the relevant circuits. So if you have a P0135 (O2 sensor heater circuit), it'll point you to the right wiring diagram. Pretty slick.` },
    ],
    daysAgo: 3,
  },
  // MORE ENGINE & ELECTRICAL
  {
    cat: 'engine',
    title: 'Starter turns over slow in the morning — new battery, what else?',
    vehicle: { year: 2008, make: 'Toyota', model: 'Tundra' },
    body: `Brand new battery, terminals are clean and tight, but the engine still cranks sluggishly in the morning for the first start. Fires up fine, just sounds labored. Once the engine is warm, restarts are instant. Could the starter motor be going bad?`,
    replies: [
      { body: `Could be the starter, but check these first:\n\n1. **Ground cables** — the battery-to-chassis and engine-to-chassis grounds are just as important as the positive cable. Unbolt them, wire brush the contact surfaces, and re-tighten. Corroded grounds cause more slow-crank issues than bad starters.\n\n2. **Voltage drop test** — with a multimeter, check voltage at the starter while cranking. Should be 10.5V+ at the starter terminal. If it's lower than what's at the battery, you have a cable/connection resistance issue.\n\n3. **Oil viscosity** — if you're running 5W-30 and it's cold outside, the engine is harder to turn over. Make sure you're using the recommended viscosity for your climate.\n\n4. **Starter draw test** — a weak starter will draw excessive amps. Normal is 150-200A for a V8. Over 250A = starter is dragging.\n\nThe '08 Tundra with the 5.7L is known for starter issues at higher mileage. The starter is under the intake manifold — not a fun job but doable. The [2008 Tundra wiring diagrams](/wiring/2008/Toyota/Tundra) have the complete starting circuit if you want to do voltage drop testing.` },
      { body: `Check your ground strap from the engine block to the firewall. On Tundras it goes behind the intake and corrodes. Common issue, $5 fix if you make a new one from battery cable.` },
    ],
    daysAgo: 8,
  },
  // MORE HEATING & COOLING
  {
    cat: 'heating',
    title: 'Radiator fan not coming on — engine overheating in traffic',
    vehicle: { year: 2006, make: 'Honda', model: 'Civic' },
    body: `Car overheats in stop and go traffic but temp is fine on the highway. I popped the hood while idling and the radiator fan isn't spinning. Is this a fuse, relay, fan motor, or temp sensor issue? How do I figure out which one?`,
    replies: [
      { body: `Good news — this is very diagnosable. The fan circuit has 4 components. Test them in order from cheapest to most expensive:\n\n**1. Fuse ($1)** — Check the radiator fan fuse in the under-hood fuse box. The '06 Civic has it clearly labeled on the lid.\n\n**2. Relay ($10-15)** — The fan relay is in the same fuse box. Swap it with another identical relay in the box (horn relay is usually the same part number). If the fan starts working, buy a new relay.\n\n**3. Coolant temp sensor/switch ($15-25)** — This tells the ECU when to turn on the fan. You can bypass it for testing: unplug the sensor and jump the two wires in the connector. If the fan kicks on, replace the sensor.\n\n**4. Fan motor ($80-150)** — If fuse, relay, and sensor are all good, apply 12V directly to the fan motor connector. If it doesn't spin → dead motor.\n\nThe [2006 Civic wiring diagrams](/wiring/2006/Honda/Civic) have the complete cooling fan circuit showing every connector, fuse, and relay in the path. Makes tracing really easy.\n\n**Emergency tip:** Until you fix it, turn your heater to MAX HOT with the blower on high when you're stuck in traffic. The heater core acts as a mini radiator and will keep the temp down.` },
      { body: `On the 8th gen Civic specifically, the fan relay solder joints on the fuse box circuit board are known to crack. If the relay tests good outside the box but doesn't work in the box, the issue is the solder joint on the box itself. You can re-solder it for free if you have a soldering iron.` },
      { body: `Also check if the AC fan works (turn on AC, the other fan should spin). The Civic has two fans — one for the radiator and one for the AC condenser. If the AC fan works, it proves the wiring harness is good and narrows it to the radiator fan circuit specifically.` },
    ],
    daysAgo: 5,
  },
  // MORE BRAKES & SUSPENSION  
  {
    cat: 'brakes',
    title: 'Car pulls to the right when braking — alignment or brake issue?',
    vehicle: { year: 2016, make: 'Hyundai', model: 'Elantra' },
    body: `When I brake from highway speed, the car pulls hard to the right. Normal driving it tracks straight. Had an alignment done 3 months ago and the shop said everything was in spec. Is this a brake caliper sticking?`,
    replies: [
      { body: `Pulling only while braking = brake issue, not alignment. If alignment were off, it'd pull all the time.\n\nThe pull goes toward the side that's gripping MORE. So pulling right means either:\n- **Right caliper is grabbing harder** (slides stuck = more clamping force)\n- **Left caliper is lazy** (stuck/seized = less clamping force on that side)\n\n**How to tell which side:**\n1. Drive and brake moderately a few times\n2. Carefully feel each wheel hub/rotor area (DON'T TOUCH THE ROTOR) — the problem side will be noticeably hotter\n3. If the LEFT side is cooler, that caliper isn't applying fully\n4. If the RIGHT side is scorching, that caliper is sticking on\n\n**Most common cause:** Caliper slide pins seized. The pins need to be cleaned and lubed with silicone brake grease every brake job. When they seize, the caliper can't float and applies uneven pressure.\n\nThe fix is usually pulling the caliper, cleaning and re-greasing the slide pins, and checking that the piston retracts smoothly. If the piston is stuck, you need a caliper ($50-80 reman).` },
      { body: `Also check the brake hose on the left side. Rubber brake hoses can deteriorate internally and create a flap that acts like a check valve — lets fluid through to apply the brake but restricts it from releasing. The caliper applies but doesn't fully release. External inspection won't catch it; you need to crack the bleeder while the caliper is stuck to see if fluid rushes out.` },
    ],
    daysAgo: 9,
  },
  // MORE TRANSMISSION
  {
    cat: 'transmission',
    title: 'Clunk when shifting from park to drive — 2012 Chevrolet Silverado',
    vehicle: { year: 2012, make: 'Chevrolet', model: 'Silverado' },
    body: `Every time I start the truck and shift from P to D, I get a solid "clunk" that I can feel through the whole truck. No issues once it's in gear — shifts fine. Is the transmission going?`,
    replies: [
      { body: `This is very common on GM trucks and usually NOT the transmission itself. The clunk is typically from drivetrain lash — the slack between components getting taken up all at once.\n\n**Check in order:**\n1. **U-joints** — get under the truck and try to twist each U-joint on the driveshaft by hand. Any play = worn U-joint ($15 each, easy to replace). This is the #1 cause of the P-to-D clunk on Silverados.\n2. **Transmission mount** — a worn mount allows the trans to shift position when loading/unloading. Visual check — look for cracked/sagging rubber.\n3. **Transfer case (if 4WD)** — the transfer case chain stretches over time, creating slack.\n4. **Differential backlash** — ring and pinion wear increases the gap between gear teeth.\n\nThe telltale for U-joints: if you also feel a clunk when you tip into/out of the gas pedal at low speed, it's almost certainly U-joints. That load/unload cycle takes up the play each time.\n\nParts stores will check U-joints for free if you're not comfortable getting under the truck.` },
      { body: `My '13 Sierra did the same thing. Replaced both rear U-joints ($30 total, 2 hours with basic tools) and the clunk was completely gone. Those U-joints had zero grease fittings from the factory — they're sealed and once they start going, they go fast.\n\nWhen you replace them, spend the extra $5 each for the Spicer greaseable U-joints. Then hit them with the grease gun every oil change and they'll last forever.` },
    ],
    daysAgo: 11,
  },
  // A FEW MORE LONG-TAIL TARGETS
  {
    cat: 'engine',
    title: 'White smoke from exhaust when first starting — goes away after warmup',
    vehicle: { year: 2011, make: 'Ford', model: 'F-150' },
    body: `Every morning I get a puff of white smoke from the exhaust for the first 30 seconds to a minute, then it clears up. It's not massive — just noticeable. Coolant level stays the same. Is this normal condensation or should I be worried?`,
    replies: [
      { body: `If the coolant level isn't dropping and it clears up within a minute, this is almost certainly **condensation** and completely normal.\n\nHere's what happens: Overnight, water vapor condenses inside the exhaust system (manifold, pipes, muffler). When you start the engine, the hot exhaust turns that water into steam → white "smoke."\n\nThis is more noticeable when:\n- It's cold outside\n- Humidity is high\n- The car sat overnight vs. just a few hours\n\n**When to worry about white smoke:**\n- It persists well after warmup (5+ minutes)\n- It smells sweet (coolant burning)\n- Coolant level keeps dropping\n- The smoke is thick and billowing, not wispy\n- You see it in the rearview constantly while driving\n\nThe persistent sweet-smelling white smoke = coolant entering combustion chamber = head gasket territory. But a brief puff at startup that clears up? That's just physics. Every car does it, some are just more visible than others.` },
      { body: `One way to double-check: next time it's doing the white smoke thing, hold a piece of white paper near the exhaust tip for 10 seconds. If it just gets damp with water → condensation. If it leaves an oily residue with a sweet smell → coolant. If it leaves a dark sooty residue → oil burning (different issue).` },
    ],
    daysAgo: 6,
  },
  {
    cat: 'oil',
    title: 'How long can you really go between oil changes with synthetic oil?',
    vehicle: { year: null, make: null, model: null },
    body: `The shop that did my last oil change says come back in 3,000 miles. The dealer says 7,500. The oil bottle says it's good for 10,000 miles. My owner's manual says 5,000 for normal conditions, 10,000 for ideal. Who do I believe? I mostly drive highway.`,
    replies: [
      { body: `Trust your owner's manual, not the quick lube shop. Here's the reality:\n\n**The 3,000-mile myth** was true in the 1970s with conventional oil. Modern full synthetic oil is a completely different product. Quick lube shops push 3,000 miles because they make money on frequency.\n\n**For most modern cars running full synthetic:**\n- Mostly highway driving: 7,500-10,000 miles is perfectly fine\n- Mixed driving: 5,000-7,500 miles\n- Severe conditions (lots of short trips, dusty environment, towing): 5,000 miles\n\n**The real answer:** Follow your car's oil life monitor if it has one. These systems track actual engine conditions — RPM, temperature, cold starts, load — and calculate when the oil is actually degraded. They're surprisingly accurate.\n\n**If you want proof:** Get a used oil analysis from Blackstone Labs (~$30). Send them a sample at whatever interval you're considering. They'll tell you exactly how much life is left in the oil, plus screen for engine wear metals. It's like a blood test for your engine.\n\nFor highway driving, you're in the easiest conditions possible. Highway = consistent RPM, full operating temp, no cold start cycling. You could comfortably do 7,500-10,000 miles with any name-brand full synthetic.` },
      { body: `I've been using Blackstone Labs for 3 years. I run Mobil 1 0W-20 in my Accord and consistently go 10,000 miles between changes. Every analysis comes back with the oil still having plenty of life and zero abnormal wear metals. \n\nThe 3,000 mile thing is a profit center for quick lube shops. Follow your manual.` },
      { body: `The one caveat: direct injection engines (most cars 2012+) tend to dilute oil with fuel more than port injection engines. If your car is DI, I'd stay at 5,000-7,500 even with synthetic. The fuel dilution degrades the oil faster than the additives wearing out.\n\nCheck your dipstick — if the oil level is HIGHER than where you filled it, that's fuel dilution and you should change sooner.` },
    ],
    daysAgo: 2,
  },
  {
    cat: 'heating',
    title: 'Burning smell from vents when heater is on — not sweet, more like burning dust',
    vehicle: { year: 2015, make: 'Toyota', model: 'RAV4' },
    body: `First time turning on the heater this fall and there's a burning smell coming from the vents. Not a sweet coolant smell — more like burning dust or lint. Goes away after 10-15 minutes. Happens every year. Is this normal or is something wrong with the heater core?`,
    replies: [
      { body: `This is completely normal and happens to nearly everyone the first time they use the heater each season. What you're smelling is literally dust burning off the heater core and the blower motor housing.\n\nOver the summer months, dust and debris settle on the heater core fins and inside the HVAC ducts. When you blast hot air through them for the first time, that dust burns off. 10-15 minutes of run time and it's done for the season.\n\n**If you want to prevent it:**\nReplace your cabin air filter before winter. It's usually behind the glove box, takes 5 minutes, and costs $10-15. A clean filter means less dust gets into the system.\n\n**When to actually worry:**\n- Sweet antifreeze smell = leaking heater core\n- Oily/chemical smell that doesn't go away = something actually burning\n- Smoke (not steam) from the vents = electrical issue, shut off immediately\n- Smell only when AC runs = mold in the evaporator (need an evaporator cleaner spray)` },
      { body: `Pro tip: about 2 weeks before you think you'll need the heater, turn it on high for 20 minutes with the windows down. Burns off all the dust without stinking up your car during the first cold morning commute.` },
    ],
    daysAgo: 4,
  },
  {
    cat: 'brakes',
    title: 'ABS light on after replacing brake pads — did I break something?',
    vehicle: { year: 2014, make: 'Honda', model: 'Civic' },
    body: `Just did my own brake pads and rotors for the first time. Went great, brakes feel awesome. But now the ABS light is on. Did I damage an ABS sensor? I was pretty careful but I did use a pry bar to push the caliper piston back in.`,
    replies: [
      { body: `You probably didn't break anything. A few common causes after a brake job:\n\n**1. ABS sensor wire** — When you removed the caliper, the ABS sensor wire might have gotten stretched or pulled from its bracket. Inspect both front sensors — the wire runs from the sensor on the knuckle up to the harness clip on the strut. Make sure it's properly routed and clipped. A wire rubbing on the tire will set a code real quick.\n\n**2. Air in the ABS module** — When you pushed the caliper pistons back, you pushed fluid back through the system. If air got into the ABS hydraulic unit, it'll throw a light. Some cars need an ABS bleed procedure (requires a scan tool) vs just a regular brake bleed.\n\n**3. Sensor gap** — If you disturbed the ABS tone ring or the sensor moved, the air gap might be off. The sensor should be close to the tone ring but not touching.\n\n**4. Low brake fluid** — Did you top off the reservoir after compressing the pistons? Some cars set an ABS code for low fluid level.\n\nGet the code read (free at AutoZone) and it'll tell you exactly which sensor/circuit is the issue. The [2014 Civic wiring diagrams](/wiring/2014/Honda/Civic) can help trace whatever circuit the code points to.` },
      { body: `Most likely the sensor connector. On the 9th gen Civic, the ABS sensor connector is right next to where the caliper bracket bolts are. Super easy to accidentally bump it loose. Push it in until it clicks and clear the code.` },
      { body: `Also — when you pushed the piston back in, did you open the bleeder first? Best practice is to crack the bleeder and push old fluid OUT instead of back through the ABS module. That's how air gets in. If you didn't, you might need to bleed the ABS module with a scan tool that can activate the ABS pump.` },
    ],
    daysAgo: 10,
  },
  {
    cat: 'general',
    title: 'Used car inspection checklist — what to look at before buying?',
    vehicle: { year: null, make: null, model: null },
    body: `Looking at a used car this weekend from a private seller. I'm not a mechanic but I know the basics. What should I be checking to avoid buying someone else's problem? Is there a good checklist?`,
    replies: [
      { body: `Here's my used car inspection checklist from 15 years of buying/selling:\n\n**Before you go:**\n- Run a Carfax/AutoCheck ($40 — ask seller for VIN upfront)\n- Check recall status at NHTSA.gov\n- Research common problems for that specific year/make/model\n\n**Visual inspection (engine off):**\n- Oil dipstick: dark is OK, milky = head gasket, metal flakes = engine wear\n- Coolant: should be clean green/orange/pink, not brown or oily\n- Transmission fluid: should be red/pink, not brown/burnt smelling\n- Under the car: look for fresh leaks, rust on frame/subframe, evidence of collision repair\n- Tires: even wear? All matching brand? Uneven wear = alignment or suspension issues\n- Body panels: gaps even? Mismatched paint? Overspray on rubber trim? = accident repair\n- All lights working (headlights, turns, brake, reverse)\n\n**Running inspection:**\n- Cold start (ask seller NOT to warm it up before you arrive)\n- Listen for ticking, knocking, squealing on startup\n- Exhaust smoke: blue = oil, white = coolant, black = running rich\n- All gauges normal, no warning lights\n- AC blows cold, heater blows hot\n- All power windows, locks, mirrors work\n- Radio, Bluetooth, backup camera functional\n\n**Test drive (minimum 20 minutes):**\n- Accelerate hard: any hesitation, jerking, or smoke?\n- Highway speed: vibrations, pulling, wind noise?\n- Brake from highway speed: pulling, pulsing, grinding?\n- Sharp turns both directions: clicking (CV joints), clunking (suspension)\n- Go over bumps: rattles, clunks, bouncing?\n- Transmission: smooth shifts? All gears engage?\n\n**After the drive:**\n- Re-check under the car for new drips\n- Open the oil cap: any milky residue or smoke?\n- Feel each wheel: any excessively hot? (could be sticking brake)\n\n**Final step:** Pay a trusted mechanic $100-150 for a pre-purchase inspection. Best money you'll ever spend. They'll catch things you won't.` },
      { body: `The biggest tell I look for: does the seller let you get a PPI (pre-purchase inspection)? If they resist or say "it was just inspected" — walk away. Honest sellers have nothing to hide.\n\nAlso always, ALWAYS do a cold start. A warm engine hides a lot of sins.` },
      { body: `One more thing nobody mentions: check the door jamb sticker vs what the seller claims. It has the original paint color code, weight ratings, and manufacture date. If the car was "repainted to original color" — why? Probably accident damage they don't want to disclose.` },
    ],
    daysAgo: 1,
  },
  {
    cat: 'oil',
    title: 'Can I switch from conventional to synthetic oil at 100k miles?',
    vehicle: { year: 2009, make: 'Toyota', model: 'Camry' },
    body: `My Camry has been running conventional 5W-30 since new, now at 102k miles. Everyone says synthetic is better but I've heard switching to synthetic on a high-mileage engine can cause leaks because it cleans out old sludge that was sealing things. Is this an old wives tale or legit?`,
    replies: [
      { body: `It's an old wives' tale that had some truth in the 1970s-80s but is completely outdated now.\n\n**The original concern:** Early synthetic oils used a different base (polyalphaolefin + ester blends) that could shrink certain old-style rubber seals, causing leaks. Those seal materials haven't been used since the late 1980s.\n\n**Modern reality:**\n- All major synthetic oils are fully compatible with modern seal materials\n- API certification (the donut on the bottle) requires seal compatibility testing\n- Toyota itself recommends synthetic for your engine\n\n**The "cleaning out sludge" concern:**\nSynthetic does have better detergent properties. If the engine has significant sludge buildup, switching to synthetic CAN reveal existing leaks that were plugged by sludge. But here's the thing — those leaks already exist. The sludge was masking a problem, not solving it.\n\nAt 102k on a Camry with regular oil changes, you probably don't have significant sludge. Switch to synthetic and enjoy longer intervals and better protection. Your 2AZ-FE will love it.\n\n**If you're nervous:** Use a high-mileage synthetic (Mobil 1 High Mileage, Pennzoil Platinum High Mileage, etc.). These have seal conditioners that keep older seals supple. Best of both worlds.` },
      { body: `Switched my '07 Camry to Mobil 1 at 95k. Zero issues, now at 215k and the engine is clean as a whistle inside. Do it. The "causes leaks" thing is pure myth at this point.` },
    ],
    daysAgo: 8,
  },
];

async function seed() {
  let threadCount = 0;
  let postCount = 0;

  for (const t of THREADS) {
    const threadId = crypto.randomUUID();
    const authorId = pick(AUTHORS);
    const createdAt = daysAgo(t.daysAgo);

    // Insert thread
    const { error: tErr } = await sb.from('forum_threads').insert({
      id: threadId,
      category_id: CAT[t.cat],
      author_id: authorId,
      title: t.title,
      slug: slug(t.title),
      body: t.body,
      vehicle_year: t.vehicle?.year || null,
      vehicle_make: t.vehicle?.make || null,
      vehicle_model: t.vehicle?.model || null,
      view_count: 50 + Math.floor(Math.random() * 500),
      reply_count: t.replies.length,
      is_pinned: false,
      is_locked: false,
      created_at: createdAt,
    });

    if (tErr) {
      console.error(`THREAD ERROR: ${t.title}`, tErr.message);
      continue;
    }
    threadCount++;

    // Insert replies
    let lastTime = createdAt;
    for (const r of t.replies) {
      const replyAuthor = pick(AUTHORS.filter(a => a !== authorId));
      const replyTime = hoursAfter(lastTime, 1, 12);
      lastTime = replyTime;

      const { error: pErr } = await sb.from('forum_posts').insert({
        id: crypto.randomUUID(),
        thread_id: threadId,
        author_id: replyAuthor,
        body: r.body,
        created_at: replyTime,
      });

      if (pErr) {
        console.error(`POST ERROR in "${t.title}":`, pErr.message);
      } else {
        postCount++;
      }
    }
  }

  // Update category counts
  for (const [key, catId] of Object.entries(CAT)) {
    const { count: tc } = await sb.from('forum_threads').select('*', { count: 'exact', head: true }).eq('category_id', catId);
    const { count: pc } = await sb.from('forum_posts')
      .select('*, forum_threads!inner(category_id)', { count: 'exact', head: true })
      .eq('forum_threads.category_id', catId);

    await sb.from('forum_categories').update({ thread_count: tc, post_count: pc }).eq('id', catId);
  }

  console.log(`\n✅ Seeded ${threadCount} threads with ${postCount} replies`);
  console.log('Category counts updated.');
}

seed().catch(console.error);
