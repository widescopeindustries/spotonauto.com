/**
 * Vehicle-specific repair specs — real part numbers, torque specs, belt routing.
 * Populates SSR content on guide pages to fix thin/duplicate content issue.
 * Key format: "make-model::task" (year-agnostic) or "year-make-model::task" (year-specific)
 */

export interface PartSpec {
  name: string;
  oem?: string;
  aftermarket?: string;
  spec?: string; // e.g. "Group 35 / 550 CCA" or "0.043 inch gap"
}

export interface VehicleRepairSpec {
  tools?: string[];
  parts: PartSpec[];
  warnings?: string[];
  steps: string[];
  torqueSpecs?: string;
  difficulty?: string;
  time?: string;
  vehicleNotes: string[];
  beltRouting?: string;
}

type VehicleTaskKey = string;

export const VEHICLE_REPAIR_SPECS: Record<VehicleTaskKey, VehicleRepairSpec> = {

  // ─── BMW X3 (E83 2004-2010, F25 2011-2017) ────────────────────────────────

  "bmw-x3::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Serpentine Belt", oem: "11287521695", aftermarket: "Gates K060885", spec: "6 rib, 885mm" },
      { name: "Belt Tensioner (inspect/replace if worn)", oem: "11281485498", aftermarket: "Gates 38373" },
    ],
    tools: ["10mm socket", "Belt tensioner tool or 3/8\" breaker bar", "Flashlight"],
    warnings: [
      "N52 engine has ELECTRIC power steering — there is NO power steering pump in the belt routing",
      "Tensioner is automatic spring-loaded — never manually adjust belt tension",
      "Note belt routing diagram on underside of hood before removal",
    ],
    steps: [
      "Locate the automatic belt tensioner on the front of the engine (driver side)",
      "Insert a 3/8\" breaker bar into the tensioner square drive and rotate clockwise to release belt tension",
      "Slip belt off the alternator pulley while holding tensioner open",
      "Route new belt: crankshaft → AC compressor → alternator → water pump → idler → tensioner",
      "Rotate tensioner clockwise again, slip belt over alternator, and slowly release tensioner",
      "Start engine and verify belt tracks centered on all pulleys",
    ],
    torqueSpecs: "Tensioner mounting bolt: 26 ft-lbs",
    beltRouting: "Clockwise from crankshaft: over AC compressor → alternator → water pump → idler pulley → back to spring tensioner. No power steering pump (electric steering on X3).",
    vehicleNotes: [
      "BMW X3 N52 engine uses ELECTRIC power steering — the belt routing does NOT include a PS pump pulley",
      "Gates K060885 is the correct 6-rib belt for the N52 2.5i/3.0i. The 2.0i (N46) uses a shorter belt — verify your engine code",
      "Tensioner is automatic — if belt is squealing or slipping, inspect tensioner for wear before replacing belt only",
      "If belt has shredded, inspect all pulleys for bearing failure before installing new belt",
    ],
  },

  "bmw-x3::battery-replacement": {
    difficulty: "Easy (but requires coding)",
    time: "30-45 minutes",
    parts: [
      { name: "Battery", oem: "61216928533", aftermarket: "Bosch BH7510 / Optima H7", spec: "Group H7 / 94R, 80Ah, 800 CCA minimum" },
    ],
    tools: ["10mm socket and wrench", "BMW ISTA-D, BimmerCode app (Android), or Carly adapter", "Memory saver (optional)"],
    warnings: [
      "CRITICAL: BMW requires battery registration after replacement — failure to register will cause the alternator to overcharge the new battery, shortening its life",
      "E83 (2004-2010): battery is in the TRUNK under the floor mat, not under the hood",
      "F25 (2011-2017): battery is under the rear seat on the right side",
      "Disconnect negative terminal FIRST to avoid sparks near the battery",
    ],
    steps: [
      "E83: Open trunk, lift floor mat, remove plastic cover to access battery. F25: Lift rear seat cushion, remove cover on passenger side",
      "Disconnect negative (black) terminal first, then positive (red)",
      "Remove the battery hold-down bracket (10mm bolt)",
      "Slide battery out — note it's heavy (~45 lbs)",
      "Install new H7/94R battery, reconnect positive then negative",
      "Register battery using BimmerCode (free app) or a BMW scan tool — select 'Battery Registration' and input new battery capacity (80Ah)",
    ],
    torqueSpecs: "Battery terminal bolts: 4-6 ft-lbs (do not overtighten)",
    vehicleNotes: [
      "Battery is NOT under the hood — it's in the trunk (E83) or under the rear passenger seat (F25)",
      "BMW REQUIRES battery registration after replacement via coding software — without this step the new battery degrades quickly",
      "Use minimum Group H7 (80Ah, 800 CCA) — undersized batteries fail quickly in European vehicles with high electrical loads",
      "Free option: BimmerCode app on Android with a $20 OBD2 Bluetooth adapter handles registration in under 2 minutes",
    ],
  },

  "bmw-x3::oil-change": {
    difficulty: "Easy",
    time: "30-45 minutes",
    parts: [
      { name: "Engine Oil", spec: "BMW LL-01 certified 5W-30 ONLY — 6.9 quarts (N52 engine)" },
      { name: "Oil Filter Cartridge", oem: "11427566327", aftermarket: "Mann W712/75 or Mahle OC 427" },
      { name: "Drain Plug Washer", oem: "07119963200", spec: "Aluminum crush washer, replace every oil change" },
    ],
    tools: ["17mm socket (drain plug)", "32mm cap socket for oil filter housing", "Drain pan", "Funnel", "Torque wrench"],
    warnings: [
      "BMW X3 requires BMW LL-01 certified oil — standard 5W-30 from the parts store may NOT meet this spec",
      "The X3 uses a filter cartridge (not a spin-on filter) — located on top of the engine under a plastic cap",
      "Always replace the aluminum drain plug washer — reusing old crush washers causes leaks",
    ],
    steps: [
      "Warm engine for 2 minutes, then shut off and allow to cool 5 minutes",
      "Remove oil filler cap on top of engine to allow faster draining",
      "Crawl under vehicle, locate 17mm drain plug on oil pan, position drain pan",
      "Remove drain plug and old crush washer, let oil drain fully (5-7 minutes)",
      "While draining: remove 32mm filter cap on top of engine, lift out cartridge filter and discard",
      "Install new filter cartridge with new O-ring lubricated with fresh oil, torque cap to spec",
      "Install new drain plug washer, reinstall drain plug to 18 ft-lbs",
      "Add 6.5 quarts of BMW LL-01 5W-30, start engine, check for leaks, verify level on dipstick",
    ],
    torqueSpecs: "Drain plug: 18 ft-lbs | Oil filter cap: 18 ft-lbs",
    vehicleNotes: [
      "N52 engine capacity is 6.9 quarts — add 6.5 quarts initially, check dipstick and top off to full mark",
      "BMW LL-01 is a specific oil specification — look for 'BMW LL-01 approved' on the bottle, not just 5W-30",
      "The oil filter is on TOP of the engine (not underneath) — access is easy without getting under the car",
      "Oil change interval: BMW recommends up to 15,000 miles with CBS system, but 7,500-10,000 miles is safer for longevity",
    ],
  },

  "bmw-x3::spark-plug-replacement": {
    difficulty: "Intermediate",
    time: "45-90 minutes",
    parts: [
      { name: "Spark Plugs (set of 6)", oem: "12120037244", aftermarket: "NGK 90941 (ILZKBR7B8DG) iridium", spec: "DO NOT gap iridium plugs — pre-set at 0.028 inch" },
    ],
    tools: ["5/8\" spark plug socket", "Torque wrench", "Extension (6\" and 12\")", "10mm socket for coil bolts"],
    warnings: [
      "Do NOT re-gap iridium spark plugs — adjusting the gap damages the iridium tip",
      "COP (coil-on-plug) ignition — each plug has its own coil held by one 10mm bolt",
      "Work on a COLD engine only — aluminum heads make it very easy to strip hot threads",
    ],
    steps: [
      "Remove engine cover (plastic clips or 10mm bolts depending on year)",
      "Disconnect each ignition coil: unplug electrical connector, remove 10mm bolt, pull coil straight up",
      "Remove spark plug with 5/8\" socket and extension — break loose with a firm, straight pull",
      "Thread new NGK iridium plug in by hand (never use power tools to start threading)",
      "Torque to 20-22 ft-lbs — do not exceed as aluminum threads strip easily",
      "Reinstall coil (note: apply dielectric grease to inside of coil boot before installing)",
      "Reconnect coil connector until it clicks, replace coil bolt to 7 ft-lbs",
    ],
    torqueSpecs: "Spark plugs: 20-22 ft-lbs | Coil bolts: 7 ft-lbs",
    vehicleNotes: [
      "N52 is a 6-cylinder engine — you need 6 plugs. Don't confuse with 4-cylinder N46 models",
      "BMW recommends NGK ILZKBR7B8DG (part# 90941) iridium — do not substitute with standard copper plugs",
      "Iridium plugs are pre-gapped from the factory. Do NOT use a gap tool on them",
      "Apply a small amount of anti-seize to plug threads if reinstalling into aluminum head (not needed for new plugs which are pre-coated)",
    ],
  },

  "bmw-x3::headlight-bulb-replacement": {
    difficulty: "Easy to Intermediate",
    time: "15-45 minutes",
    parts: [
      { name: "Low Beam Bulb", oem: "63127165743", aftermarket: "Osram 64210 H7 / Philips 12972VIS1 H7", spec: "H7 55W halogen (standard trim) or D1S for HID-equipped vehicles" },
      { name: "High Beam Bulb", spec: "H7 (same as low beam on non-HID trim)" },
    ],
    tools: ["Nitrile gloves (do not touch bulb glass)", "Flathead screwdriver (possibly)"],
    warnings: [
      "NEVER touch the glass of an H7 halogen bulb with bare hands — skin oils cause hot spots and premature failure",
      "HID-equipped X3s have D1S bulbs with HIGH VOLTAGE — do not attempt to replace HID bulbs with ignition on",
      "Check your trim level: base models have H7 halogen, premium trims have HID (xenon) — these require different procedures",
    ],
    steps: [
      "Open hood and locate the rear of the headlight housing on the side needing replacement",
      "Remove the rubber dust cover (twist counterclockwise and pull off)",
      "Unplug the electrical connector from the bulb",
      "Release the wire retaining clip (push in, rotate, and pull out)",
      "Pull old bulb straight out — handle by the base only",
      "Insert new H7 bulb into housing without touching the glass envelope",
      "Secure with wire clip, reconnect connector, replace dust cover",
      "Test headlight before closing hood",
    ],
    vehicleNotes: [
      "E83 X3 (2004-2010) uses H7 bulbs for both low and high beam on halogen models",
      "Access is from the engine bay — no headlight assembly removal needed on most X3s",
      "HID-equipped X3s use D1S xenon bulbs — replacement is more complex and usually requires headlight removal",
      "Upgrade option: Osram Night Breaker or Philips X-treme Vision offer 50-100% more brightness in the same H7 format",
    ],
  },

  // ─── BMW X5 (E53 1999-2006, E70 2007-2013) ────────────────────────────────

  "bmw-x5::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Serpentine Belt (3.0i)", oem: "11287512758", aftermarket: "Gates K060977", spec: "6 rib, 977mm" },
      { name: "Serpentine Belt (4.8i/4.4i)", aftermarket: "Gates K061033", spec: "6 rib, 1033mm — verify engine size" },
    ],
    tools: ["3/8\" breaker bar (for automatic tensioner)", "Flashlight", "Belt routing diagram (on hood sticker or underhood label)"],
    warnings: [
      "E53 X5 (1999-2006) HAS a power steering pump in the belt routing — E70 (2007+) 3.0si does NOT (electric steering)",
      "Verify belt length by engine size — 3.0i, 4.4i, 4.8i, and diesel variants all use different belt lengths",
    ],
    steps: [
      "Locate automatic belt tensioner (front driver side of engine)",
      "Insert 3/8\" drive into tensioner square hole and rotate clockwise to release tension",
      "Slip belt off alternator pulley and carefully remove",
      "Note routing: E53 3.0i — crank → AC → idler → alternator → PS pump → water pump → tensioner",
      "Route new belt in same path, slip over alternator last while holding tensioner open",
      "Release tensioner slowly, verify belt is centered on all pulleys",
    ],
    torqueSpecs: "Tensioner bolt: 26 ft-lbs",
    beltRouting: "E53 3.0i: Crankshaft → AC compressor → idler → alternator → power steering pump → water pump → tensioner. E70 3.0si: Crankshaft → AC compressor → alternator → idler → tensioner (no PS pump).",
    vehicleNotes: [
      "E53 (1999-2006) includes a power steering pump in the belt routing. E70 (2007-2013) 3.0si has electric steering — no PS pump",
      "4.8i/4.4i V8 models use a longer belt — do not mix up belt lengths between engine types",
      "Battery is in the rear cargo area (E53) or under the rear seat (E70) — not under the hood",
      "If belt is squealing, check tensioner spring and all idler pulleys before replacing belt alone",
    ],
  },

  "bmw-x5::battery-replacement": {
    difficulty: "Easy (requires coding)",
    time: "30-45 minutes",
    parts: [
      { name: "Battery", aftermarket: "Bosch BH8510 / Odyssey PC-1220", spec: "Group H8 / 49, minimum 70Ah / 800 CCA" },
    ],
    tools: ["10mm wrench", "BMW coding tool or BimmerCode app"],
    warnings: [
      "MUST register new battery with BMW coding software — same requirement as X3",
      "E53: battery in rear cargo area under floor mat. E70: under rear right passenger seat",
    ],
    steps: [
      "Access battery in rear cargo area (E53) or under rear seat passenger side (E70)",
      "Disconnect negative terminal first, then positive",
      "Remove hold-down bracket, slide out old battery",
      "Install new H8/49 battery, reconnect positive then negative",
      "Register battery via BimmerCode app or BMW ISTA — input 70Ah capacity",
    ],
    torqueSpecs: "Terminal bolts: 4-6 ft-lbs",
    vehicleNotes: [
      "Battery location: trunk under floor mat (E53 1999-2006) or under rear right seat cushion (E70 2007-2013)",
      "Group H8 (49) battery — larger than X3's H7. Do NOT substitute a smaller battery",
      "Battery registration required — BimmerCode app (~$25) is the easiest DIY coding solution",
      "After replacement, windows and sunroof may need to be re-initialized (hold window down, release, hold down again briefly)",
    ],
  },

  "bmw-x5::oil-change": {
    difficulty: "Easy",
    time: "30-45 minutes",
    parts: [
      { name: "Engine Oil", spec: "BMW LL-01 certified 5W-30 — 8.5 quarts (3.0i), 9.5 quarts (4.8i V8)" },
      { name: "Oil Filter Cartridge", oem: "11427512300", aftermarket: "Mann HU 926/5 x" },
      { name: "Drain Plug Washer", oem: "07119963200" },
    ],
    torqueSpecs: "Drain plug: 18 ft-lbs | Filter housing cap: 25 ft-lbs",
    steps: [
      "Remove drain plug (17mm) and drain oil completely",
      "Replace drain plug with new aluminum crush washer",
      "Remove oil filter cap (36mm) on top of engine, replace cartridge filter",
      "Add 8 quarts initially, start engine, check for leaks, top off to full mark on dipstick",
    ],
    vehicleNotes: [
      "3.0i M54/M57 engine holds 8.5 quarts — significantly more than most vehicles",
      "4.8i V8 holds approximately 9.5 quarts — always verify by checking dipstick",
      "BMW LL-01 spec oil required — regular 5W-30 does not meet BMW's internal lubrication specs",
      "Filter housing is on top of engine for easy access — filter is a cartridge, not spin-on",
    ],
  },

  // ─── Nissan Rogue (2008-2013, 2.5L QR25DE) ────────────────────────────────

  "nissan-rogue::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "15-25 minutes",
    parts: [
      { name: "Serpentine Belt", oem: "11720-JG30A", aftermarket: "Gates K040337 / Dayco 5040337", spec: "4 rib, 337mm effective length" },
    ],
    tools: ["14mm wrench or socket (tensioner bolt)", "Flashlight", "Belt hook tool (optional)"],
    warnings: [
      "Note belt routing before removal — photograph the routing with your phone",
      "Tensioner bolt rotates CLOCKWISE to release belt tension on Rogue",
    ],
    steps: [
      "Locate the spring-loaded belt tensioner on the passenger side of the engine",
      "Insert 14mm wrench on tensioner bolt and rotate CLOCKWISE to release tension",
      "Slip belt off the alternator pulley and remove — keep tensioner held open",
      "Route new belt: crankshaft → tensioner → AC compressor → power steering → alternator",
      "Slip belt over alternator while holding tensioner open, slowly release",
      "Visually verify belt is seated in all pulley grooves, start engine to check",
    ],
    torqueSpecs: "Tensioner mounting bolt: 26 ft-lbs",
    beltRouting: "Crankshaft pulley → spring tensioner → AC compressor → power steering pump → alternator. 4-rib belt. Tensioner rotates clockwise to release.",
    vehicleNotes: [
      "QR25DE engine uses a 4-rib (not 6-rib) serpentine belt — verify Gates K040337 or Dayco 5040337",
      "Belt replacement is easiest done from above with engine warm but off — rubber is more pliable when warm",
      "2008-2013 Rogue has power steering pump in belt routing (unlike later models with electric steering)",
      "If squealing persists after new belt, test the AC compressor clutch and power steering pump pulley for bearing wear",
    ],
  },

  "nissan-rogue::battery-replacement": {
    difficulty: "Easy",
    time: "15-20 minutes",
    parts: [
      { name: "Battery", oem: "24410-JG200", aftermarket: "Optima 35 / Interstate MTP-35 / DieHard Gold 35", spec: "Group 35, minimum 550 CCA" },
    ],
    tools: ["10mm socket and wrench"],
    warnings: [
      "Disconnect negative (black) terminal first to prevent shorts",
      "No battery registration or coding required on Nissan Rogue",
    ],
    steps: [
      "Locate battery under hood on driver side",
      "Disconnect 10mm negative terminal, then 10mm positive terminal",
      "Remove the 10mm battery hold-down bolt and clamp at the base",
      "Lift out old battery — note positive terminal faces toward front of vehicle",
      "Install new Group 35 battery in same orientation",
      "Connect positive terminal first, then negative — torque to 4-6 ft-lbs",
    ],
    torqueSpecs: "Terminal clamp bolts: 4-6 ft-lbs | Hold-down bolt: 10 ft-lbs",
    vehicleNotes: [
      "Group 35 battery — positive terminal faces toward the FRONT of the engine bay on the Rogue",
      "No battery coding or registration needed — just swap and go",
      "Nissan Intelligent Key system may need re-sync after battery change: hold unlock button on key fob near door handle for 3 seconds",
      "If CVT warning light appears after battery change, it will self-clear after a few drive cycles",
    ],
  },

  "nissan-rogue::oil-change": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Engine Oil", spec: "0W-20 full synthetic (Nissan Genuine or equivalent) — 4.9 quarts with filter" },
      { name: "Oil Filter", oem: "15208-65F0E", aftermarket: "Mobil 1 M1-108A / K&N KN-204-1" },
      { name: "Drain Plug Washer", oem: "11026-01M02", spec: "Replace at every oil change" },
    ],
    tools: ["18mm socket (drain plug)", "64mm oil filter cap wrench", "Drain pan", "Torque wrench"],
    warnings: [
      "Drain plug is 18mm — not the common 17mm found on most cars",
      "Always replace the rubber drain plug washer to prevent seeping",
    ],
    steps: [
      "Warm engine for 2 minutes, shut off, wait 5 minutes",
      "Position drain pan under 18mm drain plug (passenger-side rear of oil pan)",
      "Remove drain plug and washer, let oil drain 5-7 minutes",
      "Remove oil filter with 64mm cap-style wrench — expect additional oil to drain",
      "Install new filter (hand-tight plus 3/4 turn), install new drain plug washer, torque plug to 25 ft-lbs",
      "Add 4.5 quarts of 0W-20 through oil fill cap, check dipstick, top off to full",
    ],
    torqueSpecs: "Drain plug: 25 ft-lbs (18mm) | Oil filter: hand-tight + 3/4 turn",
    vehicleNotes: [
      "Nissan specifies 0W-20 full synthetic for 2008-2013 Rogue — 5W-30 can be used as a one-time substitute in an emergency only",
      "Drain plug is 18mm — larger than most vehicles. Don't round it off with a 17mm socket",
      "Oil filter (15208-65F0E) uses a cap-style wrench, not a standard strap wrench — 64mm or 65mm socket size",
      "Oil change interval: 5,000 miles conventional / 7,500-10,000 miles full synthetic",
    ],
  },

  "nissan-rogue::spark-plug-replacement": {
    difficulty: "Easy",
    time: "30-45 minutes",
    parts: [
      { name: "Spark Plugs (set of 4)", oem: "22401-JA01B", aftermarket: "NGK ZFR5F-11 (NGK 5174) / Denso SKJ20DR-M11", spec: "Gap: 0.043 inch — pre-gapped, verify before installing" },
    ],
    tools: ["5/8\" spark plug socket", "10mm socket (coil bolts)", "Torque wrench", "Gap gauge"],
    steps: [
      "Remove engine cover (plastic clips)",
      "Disconnect each ignition coil: unplug connector, remove 10mm bolt, pull coil straight up",
      "Blow compressed air around plug hole before removing to prevent debris entering cylinder",
      "Remove plug with 5/8\" socket — break loose slowly (may be tight after extended service)",
      "Check gap on new plug (0.043\") and adjust if needed",
      "Thread new plug in by hand, torque to 15-20 ft-lbs",
      "Apply dielectric grease inside coil boot, reinstall coil",
    ],
    torqueSpecs: "Spark plugs: 15-20 ft-lbs | Coil bolts: 7 ft-lbs",
    vehicleNotes: [
      "QR25DE engine uses 4 plugs with individual coil-on-plug (COP) ignition — one coil per cylinder",
      "OEM NGK ZFR5F-11 gap is 0.043 inch — verify with feeler gauge before installing",
      "Factory service interval is 105,000 miles for iridium plugs, but 60,000 miles recommended for performance",
      "Misfire codes P0300-P0304 on Rogue are often caused by worn plugs or faulty coil packs",
    ],
  },

  "nissan-rogue::headlight-bulb-replacement": {
    difficulty: "Easy",
    time: "10-20 minutes",
    parts: [
      { name: "Low Beam Bulb", spec: "H11 55W (2008-2013 Rogue) — SYLVANIA H11 ST or Philips H11 Vision" },
      { name: "High Beam Bulb", spec: "9005 (HB3) 65W — SYLVANIA 9005 ST" },
      { name: "Fog Light Bulb (if equipped)", spec: "H11 55W — same as low beam" },
    ],
    tools: ["None required for most years — hand access only"],
    warnings: ["Do not touch the glass envelope of halogen bulbs with bare hands"],
    steps: [
      "Open hood, reach behind headlight housing on side needing replacement",
      "Remove rubber dust cap (twist counterclockwise)",
      "Unplug the 3-wire electrical connector",
      "Release wire retaining clip (swing outward)",
      "Pull old H11 bulb straight out, grasp by plastic base",
      "Insert new H11 bulb without touching glass, secure clip, reconnect connector, replace dust cap",
      "Test before closing hood",
    ],
    vehicleNotes: [
      "2008-2013 Rogue uses H11 low beam and 9005 (HB3) high beam — they are different bulbs",
      "Access is from the engine bay without removing the headlight assembly",
      "H11 and H9 are physically interchangeable — H9 provides 65W vs 55W for a brighter beam if desired",
      "Fog lights also use H11 — access from the front bumper opening or by removing the wheel liner on some years",
    ],
  },

  // ─── Nissan Pathfinder (2005-2012, 4.0L VQ40DE) ───────────────────────────

  "nissan-pathfinder::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Serpentine Belt", oem: "11720-EA200", aftermarket: "Gates K060993 / Dayco 6PK2520", spec: "6 rib, 993mm" },
    ],
    tools: ["14mm wrench", "Flashlight"],
    warnings: ["Tensioner rotates COUNTERCLOCKWISE on the VQ40DE engine — opposite of most Nissans"],
    steps: [
      "Locate tensioner on front of engine — 14mm bolt",
      "Rotate tensioner counterclockwise to release belt tension",
      "Remove belt from alternator pulley first, then thread off remaining pulleys",
      "Route new belt: crank → AC → idler → PS pump → alternator → water pump → tensioner",
      "Hold tensioner counterclockwise, slip belt over water pump, slowly release",
    ],
    torqueSpecs: "Tensioner bolt: 26 ft-lbs",
    beltRouting: "VQ40DE 6-rib belt: Crankshaft → AC compressor → idler → power steering pump → alternator → water pump → spring tensioner. Tensioner rotates counterclockwise.",
    vehicleNotes: [
      "VQ40DE engine uses a 6-rib belt (vs. 4-rib on QR25DE Rogue) — Gates K060993",
      "Tensioner rotates COUNTERCLOCKWISE on VQ40 — confirm direction before forcing it the wrong way",
      "Some 2005-2012 Pathfinders have TWO drain plugs on the oil pan (driver and passenger side) — check both during oil changes",
      "Serpentine belt drives PS pump, AC, alternator, and water pump — one belt for the whole system",
    ],
  },

  "nissan-pathfinder::headlight-bulb-replacement": {
    difficulty: "Easy",
    time: "10 minutes",
    parts: [
      { name: "Low/High Beam Bulb (2005-2008)", spec: "H13 (9008) dual-filament — one bulb does both low and high beam" },
      { name: "Low Beam Bulb (2009-2012)", spec: "H11 55W" },
      { name: "High Beam Bulb (2009-2012)", spec: "9005 (HB3) 65W" },
    ],
    steps: [
      "Open hood — Pathfinder has generous engine bay access",
      "Remove rubber dust cover from rear of headlight housing",
      "Unplug connector and remove wire clip",
      "Pull old bulb out, install new bulb without touching glass",
      "Reconnect and test",
    ],
    vehicleNotes: [
      "2005-2008 Pathfinder uses H13 (9008) — a single dual-filament bulb for BOTH high and low beam",
      "2009-2012 changed to separate H11 (low) and 9005 (high) bulbs — verify your year before buying",
      "Pathfinder headlight access is among the easiest of any SUV — no assembly removal required",
      "H13 bulbs are also known as 9008 — they are the same bulb with different naming",
    ],
  },

  // ─── Honda Odyssey (2005-2010, 3.5L J35A) ────────────────────────────────

  "honda-odyssey::serpentine-belt-replacement": {
    difficulty: "Intermediate",
    time: "30-45 minutes",
    parts: [
      { name: "Serpentine Belt", oem: "38920-RGW-A02", aftermarket: "Gates K060860 / Bando 6PK2185", spec: "6 rib, 2185mm" },
    ],
    tools: ["10mm socket (tensioner pivot)", "12mm socket (tensioner adjuster)", "Belt tension gauge", "Torque wrench"],
    warnings: [
      "2005-2010 Odyssey has a MANUAL tensioner — there is no automatic spring tensioner like most modern vehicles",
      "Incorrect belt tension causes premature failure and component damage",
    ],
    steps: [
      "Loosen tensioner pivot bolt (10mm) — do not remove fully",
      "Turn adjuster bolt (12mm) clockwise to relieve tension",
      "Slide belt off alternator pulley and remove",
      "Route new belt: crankshaft → PS pump → AC compressor → idler → tensioner → alternator",
      "Turn adjuster bolt counterclockwise to increase tension until deflection is 0.22-0.28 inch at center of longest span",
      "Torque pivot bolt to 33 ft-lbs",
    ],
    torqueSpecs: "Tensioner pivot bolt: 33 ft-lbs | Tensioner adjuster bolt: 17 ft-lbs",
    beltRouting: "Crankshaft → power steering pump → AC compressor → idler pulley → manual tensioner → alternator. 6-rib belt, manual adjustment required on 2005-2010.",
    vehicleNotes: [
      "2005-2010 Odyssey uses a MANUAL tensioner — you must adjust tension by turning an adjuster bolt, unlike most modern vehicles with automatic tensioners",
      "Belt tension spec: 0.22-0.28 inch deflection (about 7mm) at the midpoint of the longest belt span",
      "Honda radio requires a 5-digit code after battery disconnect — write it down from the glove box sticker before starting",
      "2011+ Odyssey switched to an automatic spring tensioner — this procedure applies to 2005-2010 only",
    ],
  },

  "honda-odyssey::oil-change": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Engine Oil", spec: "Honda Genuine 5W-20 or equivalent — 4.5 quarts with filter" },
      { name: "Oil Filter", oem: "15400-PLM-A02", aftermarket: "Mobil 1 M1-110A / K&N KN-112" },
      { name: "Drain Plug Washer", oem: "90009-PH8-000" },
    ],
    tools: ["17mm socket (drain plug)", "Oil filter wrench (or cap tool for OEM filter)", "Drain pan"],
    torqueSpecs: "Drain plug: 29 ft-lbs (17mm) | Oil filter: hand-tight + 3/4 turn",
    steps: [
      "Warm engine briefly, drain oil via 17mm plug on passenger side of oil pan",
      "Replace drain plug with new washer, torque to 29 ft-lbs",
      "Remove and replace oil filter — Honda OEM uses a cartridge-style, aftermarket Mobil 1 is spin-on (easier)",
      "Add 4 quarts of Honda 5W-20, start engine, check for leaks, top to full mark",
    ],
    vehicleNotes: [
      "J35A engine holds 4.5 quarts — add 4 quarts initially, check dipstick and add remaining 0.5 quart",
      "Honda specifies 5W-20 for the J35 — this is correct, not a typo",
      "OEM Honda oil filter is a cartridge type; Mobil 1 M1-110A is a spin-on that fits the same thread and is easier to change",
      "Drain plug is on the passenger side of the oil pan — easier to access from that side",
    ],
  },

  "honda-odyssey::spark-plug-replacement": {
    difficulty: "Intermediate (front bank) / Advanced (rear bank)",
    time: "1-3 hours",
    parts: [
      { name: "Spark Plugs (set of 6)", oem: "12290-R70-A01", aftermarket: "NGK IZFR6K11S (NGK 4994) / Denso SK20HR11", spec: "Iridium/platinum, pre-gapped — do not adjust" },
    ],
    tools: ["5/8\" spark plug socket", "3\" and 6\" extensions", "Universal joint", "10mm socket (coil bolts)", "Intake manifold socket set (if removing rear bank cover)"],
    warnings: [
      "Rear 3 spark plugs (cylinders 1, 3, 5) require removing the intake manifold for proper access",
      "Do NOT attempt to reach rear plugs from underneath — very high risk of breaking the plug off in the head",
    ],
    steps: [
      "Front 3 plugs (cylinders 2, 4, 6) — accessible from front: remove coil (10mm), remove plug",
      "Rear 3 plugs — loosen intake manifold 8 bolts (10mm), move manifold forward 2-3 inches (do not fully remove, hoses can stay connected)",
      "With manifold moved, access rear plugs with extension and universal joint",
      "Torque all plugs to 13 ft-lbs, reinstall coils with dielectric grease on boots",
      "Torque intake manifold bolts in a cross pattern to 17 ft-lbs",
    ],
    torqueSpecs: "Spark plugs: 13 ft-lbs | Intake manifold bolts: 17 ft-lbs | Coil bolts: 9 ft-lbs",
    vehicleNotes: [
      "Rear 3 spark plugs on V6 Odyssey require moving the intake manifold — budget 2-3 hours for full 6-plug replacement",
      "Front 3 plugs (cylinders 2, 4, 6) take about 20 minutes. Rear 3 (cylinders 1, 3, 5) take 1.5-2 hours additional",
      "Use NGK IZFR6K11S iridium plugs — OEM spec. Do not substitute copper plugs",
      "Many shops charge $300-500 for this job due to the intake manifold work — it is DIY-able but plan for a half-day",
    ],
  },

  // ─── Honda Fit (2007-2013, 1.5L L15A) ────────────────────────────────────

  "honda-fit::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "15-25 minutes",
    parts: [
      { name: "Serpentine Belt", oem: "38920-RB0-004", aftermarket: "Gates K040339 / Bando 4PK875", spec: "4 rib — drives alternator and AC only (electric steering)" },
    ],
    tools: ["10mm socket (pivot bolt)", "10mm socket (adjuster bolt)"],
    warnings: [
      "Honda Fit has ELECTRIC power steering — NO PS pump in belt routing. Only AC and alternator",
      "Manual tensioner: must set correct tension — not automatic",
    ],
    steps: [
      "Loosen pivot bolt (10mm) on alternator",
      "Turn adjuster bolt (10mm) to relieve belt tension",
      "Remove belt from AC compressor pulley and alternator",
      "Install new belt, adjust tension to 0.24-0.35 inch deflection (6-9mm) at longest span",
      "Torque pivot bolt to 33 ft-lbs, adjuster bolt to 17 ft-lbs",
    ],
    torqueSpecs: "Alternator pivot bolt: 33 ft-lbs | Adjusting bolt lock nut: 17 ft-lbs",
    vehicleNotes: [
      "Honda Fit has electric power steering — no PS pump pulley in the belt path",
      "4-rib belt only — much simpler routing than most V6 vehicles",
      "Manual adjustment required: target 0.24-0.35 inch (6-9mm) deflection mid-span under moderate thumb pressure",
      "Belt drives only AC compressor and alternator — if either of those fail, belt may squeal or break",
    ],
  },

  "honda-fit::oil-change": {
    difficulty: "Easy",
    time: "20-25 minutes",
    parts: [
      { name: "Engine Oil", spec: "0W-20 full synthetic — 3.6 quarts with filter" },
      { name: "Oil Filter", oem: "15400-PLM-A02", aftermarket: "Mobil 1 M1-108A" },
    ],
    torqueSpecs: "Drain plug: 33 ft-lbs (17mm)",
    steps: [
      "Drain oil (17mm drain plug), replace washer",
      "Replace oil filter",
      "Add 3.3 quarts, check dipstick, top to full (full capacity 3.6 qt)",
    ],
    vehicleNotes: [
      "L15A engine is small — only 3.6 quarts capacity. Do not overfill",
      "Honda specifies 0W-20 synthetic for best fuel economy and engine protection",
      "Oil life monitoring system will indicate change interval — typically 7,500-10,000 miles on full synthetic",
      "Drain plug is on the rear of the oil pan and can be hard to spot from above — use a mirror or flashlight from underneath",
    ],
  },

  // ─── Toyota Corolla (2003-2013) ───────────────────────────────────────────

  "toyota-corolla::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "15-20 minutes",
    parts: [
      { name: "Belt (2003-2008 1ZZ-FE)", aftermarket: "Gates K040337", spec: "4 rib" },
      { name: "Belt (2009-2013 2ZR-FE)", aftermarket: "Gates K040339", spec: "4 rib — electric steering, NO PS pump" },
    ],
    tools: ["14mm wrench or socket"],
    beltRouting: "2003-2008 1ZZ: Crankshaft → AC compressor → alternator → spring tensioner. 2009-2013 2ZR: Crankshaft → AC compressor → alternator → tensioner (no PS pump — electric steering).",
    vehicleNotes: [
      "2009-2013 Corolla has electric power steering — NO PS pump in belt routing. Different belt from 2003-2008",
      "Both 1ZZ and 2ZR use automatic spring tensioners — no manual adjustment needed",
      "1ZZ engine (2003-2008) is known for oil consumption issues — check oil level every 2,000 miles",
      "Belt is accessible from the top with minimal disassembly — one of the easiest belt replacements",
    ],
    steps: [
      "Locate spring tensioner on front of engine",
      "Use 14mm to rotate tensioner clockwise (away from belt), slip belt off alternator",
      "Route new belt over all pulleys, slip over alternator last while holding tensioner open",
      "Release tensioner slowly, verify belt alignment",
    ],
    torqueSpecs: "Tensioner bolt: 19 ft-lbs",
  },

  "toyota-corolla::oil-change": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Engine Oil (2003-2008 1ZZ)", spec: "5W-30 — 4.4 quarts with filter" },
      { name: "Engine Oil (2009-2013 2ZR)", spec: "0W-20 full synthetic — 4.6 quarts" },
      { name: "Oil Filter", oem: "04152-YZZA6", aftermarket: "Fram PH2 / Mobil 1 M1-108A" },
    ],
    torqueSpecs: "Drain plug: 27 ft-lbs (14mm — smaller than most vehicles)",
    vehicleNotes: [
      "Drain plug is 14mm — smaller than most vehicles. Do NOT use a 17mm socket",
      "2003-2008 1ZZ engine: known oil consumption issue. Always check oil level monthly",
      "2009-2013 2ZR uses 0W-20 full synthetic — spec is correct, not a misprint",
      "Toyota oil filter (04152-YZZA6) is a spin-on type — standard strap wrench works fine",
    ],
    steps: [
      "Remove 14mm drain plug and drain oil",
      "Replace with new Toyota crush washer (01298-1A004) or same washer if Toyota plug-type",
      "Remove spin-on oil filter, install new with rubber O-ring lightly oiled",
      "Fill to capacity based on engine year, check dipstick",
    ],
  },

  "toyota-corolla::battery-replacement": {
    difficulty: "Easy",
    time: "15 minutes",
    parts: [
      { name: "Battery (2003-2008)", spec: "Group 35, 500 CCA minimum" },
      { name: "Battery (2009-2013)", spec: "Group 51R, 410 CCA minimum" },
    ],
    tools: ["10mm socket"],
    vehicleNotes: [
      "2003-2008 uses Group 35 battery; 2009-2013 uses Group 51R — different sizes, verify your year",
      "No battery registration or coding required on Corolla",
      "Some 2009-2013 models require power window re-initialization after battery change (hold button up then down)",
      "Radio security codes are not required on most Corolla models",
    ],
    steps: [
      "Disconnect 10mm negative terminal, then positive",
      "Remove 10mm hold-down bolt and clamp",
      "Install correct group size battery, connect positive then negative",
    ],
    torqueSpecs: "Terminal bolts: 4-6 ft-lbs",
  },

  // ─── Subaru Forester (2003-2013, 2.5L EJ25) ──────────────────────────────

  "subaru-forester::serpentine-belt-replacement": {
    difficulty: "Easy to Intermediate",
    time: "20-30 minutes",
    parts: [
      { name: "Serpentine Belt", aftermarket: "Gates K060895", spec: "6 rib — drives AC, alternator, PS pump (EJ25 horizontally-opposed engine)" },
    ],
    tools: ["12mm socket (tensioner)", "Flashlight (engine is horizontal — unusual layout)"],
    warnings: [
      "Subaru EJ25 is a BOXER (horizontally-opposed) engine — components are sideways vs. upright. Belt runs left-to-right",
      "The EJ25 also has a TIMING BELT (not chain) — check its replacement interval (105,000 miles). The serpentine is separate",
    ],
    steps: [
      "Locate automatic spring tensioner on driver side of engine",
      "Rotate tensioner clockwise with 12mm socket to release tension",
      "Remove belt carefully — boxer layout means pulleys are at unusual angles",
      "Route new belt: crankshaft → AC → alternator → PS pump → tensioner → idler",
      "Release tensioner, verify belt tracking on all pulleys",
    ],
    torqueSpecs: "Tensioner bolt: 19 ft-lbs",
    beltRouting: "EJ25 boxer: Crankshaft → AC compressor → alternator → power steering pump → tensioner → idler. Belt runs horizontally due to boxer engine orientation.",
    vehicleNotes: [
      "EJ25 is a horizontally-opposed (boxer) engine — belt routing is horizontal instead of vertical. Allow extra time to understand layout",
      "SEPARATE timing belt: EJ25 uses a rubber timing belt with a 105,000-mile replacement interval — do not confuse with serpentine belt",
      "If timing belt has not been replaced at 105k miles, do this service at the same time as serpentine belt — saves significant labor",
      "2006+ Forester models: verify you have 2.5L naturally aspirated EJ253, not the turbo EJ255 — turbo model has slightly different belt routing",
    ],
  },

  "subaru-forester::oil-change": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Engine Oil", spec: "5W-30 full synthetic recommended for EJ25 — 4.2 quarts with filter" },
      { name: "Oil Filter", oem: "15208-AA170", aftermarket: "Subaru SOA634012 / Fram PH10060" },
    ],
    torqueSpecs: "Drain plug: 33 ft-lbs (17mm)",
    vehicleNotes: [
      "EJ25 boxer engine: drain plug is on the PASSENGER side of the oil pan due to horizontal engine orientation",
      "Filter is also on the passenger side — have a rag ready as oil spills when removing",
      "EJ25 is prone to head gasket issues — check coolant level and look for milky oil after oil changes",
      "Subaru recommends 5W-30 — do not use 0W-20 which can cause EJ25 oil consumption",
    ],
    steps: [
      "Locate 17mm drain plug on passenger side of oil pan (boxer engine orientation)",
      "Drain and replace plug with new crush washer",
      "Replace oil filter on passenger side — expect some oil spill, have rags ready",
      "Add 4 quarts, start and check, top to full mark",
    ],
  },

  // ─── Chevrolet Silverado (5.3L LS/LM7, 1999-2013) ────────────────────────

  "chevrolet-silverado::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "15-20 minutes",
    parts: [
      { name: "Serpentine Belt (5.3L no AC)", aftermarket: "Gates K060840", spec: "6 rib, 840mm" },
      { name: "Serpentine Belt (5.3L with AC)", aftermarket: "Gates K060995", spec: "6 rib, 995mm" },
    ],
    tools: ["15mm wrench or 3/8\" drive for tensioner", "Belt routing diagram (on hood decal)"],
    warnings: ["Verify whether your truck has AC — belt lengths differ significantly"],
    steps: [
      "Locate tensioner on driver side of engine",
      "Rotate tensioner clockwise (15mm) to release tension",
      "Remove belt, route new belt per hood diagram",
      "Routing with AC: crank → AC → idler → water pump → PS pump → alternator → tensioner",
      "Slip over last pulley while holding tensioner, release slowly",
    ],
    torqueSpecs: "Tensioner bolt: 37 ft-lbs",
    beltRouting: "5.3L with AC: Crankshaft → AC compressor → idler → water pump → power steering → alternator → tensioner. Without AC: Crankshaft → idler → water pump → power steering → alternator → tensioner.",
    vehicleNotes: [
      "Belt size differs between AC and non-AC trucks — verify your configuration before purchasing",
      "5.3L LS uses a 15mm tensioner bolt — rotate clockwise to release",
      "Silverado belt routing diagram is on a sticker in the engine bay near the radiator support",
      "4.8L, 5.3L, and 6.0L all use similar routing but different belt lengths — verify by engine code on door jamb sticker",
    ],
  },

  "chevrolet-silverado::oil-change": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Engine Oil", spec: "Dexos 1 Gen 2 approved 5W-30 — 6 quarts (5.3L)" },
      { name: "Oil Filter", oem: "PF48", aftermarket: "AC Delco PF48 / Mobil 1 M1-301" },
    ],
    torqueSpecs: "Drain plug: 18 ft-lbs (15mm)",
    vehicleNotes: [
      "5.3L LS/LM7 requires Dexos 1 approved oil — standard 5W-30 may not meet GM's Dexos specification",
      "Drain plug is 15mm — not the common 17mm or 18mm. Use correct socket",
      "Oil filter is accessible from below — AC Delco PF48 is OEM specification",
      "Engine holds 6 quarts — add 5.5 quarts, check dipstick, add remaining if needed",
    ],
    steps: [
      "Remove 15mm drain plug and drain 6 quarts",
      "Replace spin-on AC Delco PF48 filter",
      "Install new drain plug, torque to 18 ft-lbs",
      "Fill with Dexos-approved 5W-30, check oil life monitor reset (hold info button)",
    ],
  },

  "chevrolet-silverado::spark-plug-replacement": {
    difficulty: "Intermediate",
    time: "1.5-2.5 hours",
    parts: [
      { name: "Spark Plugs (set of 8)", oem: "12571164", aftermarket: "ACDelco 41-962 / NGK TR55IX iridium", spec: "Gap: 0.040 inch — pre-set on iridium" },
    ],
    tools: ["5/8\" spark plug socket", "6\" and 12\" extensions", "Universal joint", "Torque wrench"],
    warnings: [
      "CRITICAL: 5.3L has aluminum cylinder heads — do NOT exceed 11 ft-lbs torque or you will strip threads",
      "Plugs are often seized from years of service — apply penetrating oil, work hot/cold cycles if stuck",
    ],
    steps: [
      "Remove plastic engine cover",
      "Disconnect individual coil packs (10mm bolt each)",
      "Use 5/8\" socket with 6\" extension — plugs are recessed deep in valve cover tubes",
      "Break loose slowly — if excessive resistance, apply penetrating oil and wait 20 minutes",
      "Gap check new plugs at 0.040 inch, thread in by hand",
      "Torque to ONLY 11 ft-lbs — aluminum threads are easily damaged",
      "Apply dielectric grease to coil boots before reinstalling",
    ],
    torqueSpecs: "Spark plugs: 11 ft-lbs MAXIMUM (aluminum heads) | Coil bolts: 89 in-lbs (7.4 ft-lbs)",
    vehicleNotes: [
      "5.3L LS has ALUMINUM cylinder heads — 11 ft-lbs maximum plug torque. Many DIYers strip threads by over-tightening",
      "8 plugs total on V8 — budget 1.5-2.5 hours. Passenger side rear (cylinder 8) is the tightest",
      "Apply anti-seize to plug threads to prevent future seizing, especially if vehicle is used in northern climates",
      "ACDelco 41-962 is the OEM plug — NGK TR55IX iridium is an excellent upgrade with longer service life",
    ],
  },

  // ─── Kia Soul (2010-2013, 2.0L Theta II) ─────────────────────────────────

  "kia-soul::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "15-20 minutes",
    parts: [
      { name: "Serpentine Belt (2.0L)", aftermarket: "Gates K040339", spec: "4 rib — electric power steering, no PS pump" },
    ],
    tools: ["14mm socket (tensioner)"],
    beltRouting: "Crankshaft → AC compressor → idler → alternator → spring tensioner. No power steering pump (electric steering).",
    vehicleNotes: [
      "Kia Soul has ELECTRIC power steering — no PS pump pulley in belt routing",
      "Spring tensioner accessed from top of engine — 14mm bolt rotates to release",
      "1.6L and 2.0L Soul models use the same belt on most years",
      "Belt inspection: if belt has more than 3 cracks per 3 inches of belt surface, replace immediately",
    ],
    steps: [
      "Rotate 14mm tensioner clockwise to release belt tension",
      "Remove belt from alternator, thread off remaining pulleys",
      "Route new belt: crank → AC → idler → alternator",
      "Hold tensioner, slip belt over alternator, release slowly",
    ],
    torqueSpecs: "Tensioner bolt: 26 ft-lbs",
  },

  "kia-soul::oil-change": {
    difficulty: "Easy",
    time: "20 minutes",
    parts: [
      { name: "Engine Oil (2.0L)", spec: "5W-20 full synthetic — 4.2 quarts with filter" },
      { name: "Oil Filter", oem: "26300-35504", aftermarket: "Fram PH8A" },
    ],
    torqueSpecs: "Drain plug: 25-33 ft-lbs (14mm)",
    vehicleNotes: [
      "Drain plug is 14mm — same smaller size as Toyota Corolla",
      "Kia Theta II 2.0L uses 5W-20 synthetic — do not use heavier 5W-30",
      "Oil filter (26300-35504) is shared across many Kia/Hyundai models",
      "Oil change interval: 7,500 miles with synthetic",
    ],
    steps: [
      "Drain via 14mm drain plug, replace with new washer",
      "Spin off old filter, install new Fram PH8A hand-tight plus 3/4 turn",
      "Fill 4.0 quarts, check dipstick",
    ],
  },

  // ─── Honda CR-V (2002-2011, 2.4L K24) ────────────────────────────────────

  "honda-cr-v::battery-replacement": {
    difficulty: "Easy",
    time: "15 minutes",
    parts: [
      { name: "Battery", spec: "Group 51R, 410-500 CCA. Honda part# 31500-SCA-A01 or Optima DS46B24R" },
    ],
    tools: ["10mm socket"],
    warnings: ["Honda radio requires 5-digit security code after battery disconnect — find it in glovebox or call dealer with VIN"],
    steps: [
      "Note radio code from sticker inside glovebox or owner's manual",
      "Disconnect 10mm negative terminal, then positive",
      "Remove 12mm hold-down bolt at battery base",
      "Install Group 51R battery, positive terminal toward engine",
      "Reconnect positive then negative, enter radio code",
    ],
    vehicleNotes: [
      "Radio security code is required after battery replacement — it's on a small card in the glovebox or call Honda with VIN",
      "Group 51R battery — positive terminal is on the RIGHT side when battery faces you",
      "No computer coding required on CR-V — simple swap",
      "Power windows may need to be re-initialized: hold down fully, release, hold down 2 seconds",
    ],
    torqueSpecs: "Terminal bolts: 4-6 ft-lbs",
  },

  "honda-cr-v::oil-change": {
    difficulty: "Easy",
    time: "20-25 minutes",
    parts: [
      { name: "Engine Oil (K24, 2002-2006)", spec: "5W-30 — 4.2 quarts" },
      { name: "Engine Oil (K24A, 2007-2011)", spec: "5W-20 — 4.4 quarts" },
      { name: "Oil Filter", oem: "15400-PLM-A02", aftermarket: "Mobil 1 M1-108A" },
    ],
    torqueSpecs: "Drain plug: 33 ft-lbs (17mm)",
    vehicleNotes: [
      "K24 engine capacity: 4.2-4.4 quarts. Add 4 quarts first, check dipstick, add remaining",
      "2002-2006 uses 5W-30; 2007-2011 uses 5W-20 — verify your year",
      "Drain plug is 17mm on K24 CR-V — accessible from passenger side of oil pan",
      "Honda Maintenance Minder will calculate oil change interval based on driving conditions",
    ],
    steps: [
      "Drain oil via 17mm drain plug, replace crush washer",
      "Replace oil filter (Honda cartridge or Mobil 1 spin-on)",
      "Fill to capacity for your engine year",
    ],
  },

  "honda-cr-v::spark-plug-replacement": {
    difficulty: "Easy to Intermediate",
    time: "45-75 minutes",
    parts: [
      { name: "Spark Plugs (2002-2006 K24A1)", aftermarket: "NGK IFR6J11 / Denso SKJ20DR-M11", spec: "Gap 0.044 inch, 4 plugs" },
      { name: "Spark Plugs (2007-2011 K24Z1)", aftermarket: "NGK IZFR6K11 / Denso SKJ20DR-M11", spec: "Iridium, 4 plugs" },
    ],
    tools: ["5/8 inch spark plug socket", "10mm socket", "6 inch extension", "Torque wrench"],
    warnings: [
      "K24 uses coil-on-plug ignition - unplug each coil and remove the 10mm retaining bolt before pulling the coil",
      "Work on a cold aluminum head only to avoid damaging spark plug threads",
      "Do not overtighten the plugs - K-series heads strip easily if forced",
    ],
    steps: [
      "Remove the engine cover if equipped and unplug each ignition coil connector",
      "Remove the 10mm coil bolts, pull the coils straight up, and inspect boots for oil intrusion",
      "Remove each spark plug with a 5/8 inch socket and extension",
      "Install new plugs by hand first, then torque evenly to spec",
      "Reinstall coils, connectors, and engine cover, then start the engine and verify smooth idle",
    ],
    torqueSpecs: "Spark plugs: 13 ft-lbs | Ignition coil bolts: 7 ft-lbs",
    vehicleNotes: [
      "The 2.4L K24 is a 4-cylinder engine, so this job uses only 4 plugs and is easier than the V6 Honda jobs",
      "If you see oil in a plug tube, the valve cover tube seals are leaking and should be addressed before installing new plugs",
      "Honda service interval on iridium plugs is typically 105,000 miles, but misfire complaints often start earlier on neglected engines",
      "Use NGK or Denso only - cheap plugs often cause rough idle on K-series engines",
    ],
  },

  "honda-cr-v::starter-replacement": {
    difficulty: "Intermediate",
    time: "1.5-2.5 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Denso 280-6012 / Honda reman equivalent", spec: "2.4L K24 starter" },
      { name: "Starter terminal nut", spec: "Reuse if clean; replace if heavily corroded" },
    ],
    tools: ["10mm, 12mm, and 14mm sockets", "Long extension", "Ratchet", "Floor jack"],
    warnings: [
      "Disconnect the negative battery cable first - the main starter cable is always hot",
      "Access is tight under the intake manifold, so make sure the socket is fully seated before breaking bolts loose",
      "If the starter only clicks, verify battery voltage and ground condition before replacing the unit",
    ],
    steps: [
      "Disconnect the battery negative cable and raise the front of the vehicle if you need lower access",
      "Remove the intake duct or resonator as needed for room at the back of the engine",
      "Unplug the solenoid trigger wire and remove the main battery cable nut",
      "Remove the starter mounting bolts and work the starter out from under the intake area",
      "Install the new starter, reconnect wiring, and confirm a strong crank before reassembling the intake pieces",
    ],
    torqueSpecs: "Starter mounting bolts: 33 ft-lbs | Main cable nut: snug only",
    vehicleNotes: [
      "On 2nd and 3rd gen CR-Vs the starter sits on the transmission bellhousing below the intake manifold",
      "Weak batteries and dirty grounds can mimic a bad starter - voltage drop test first if symptoms are inconsistent",
      "A hot-soak no-crank on the K24 is a common starter failure pattern",
      "If the engine grinds after replacement, stop immediately and verify the starter nose and mounting alignment",
    ],
  },

  "honda-civic::water-pump-replacement": {
    difficulty: "Advanced",
    time: "3-5 hours",
    parts: [
      { name: "Water Pump", aftermarket: "Aisin / Gates equivalent", spec: "Match engine family before ordering" },
      { name: "Timing belt kit or drive belt hardware", spec: "Varies by engine and generation" },
      { name: "Honda Type 2 coolant", spec: "Premixed blue coolant" },
    ],
    warnings: [
      "Civic water pump procedure changes drastically by engine - older D/B-series engines are timing-belt driven",
      "On timing-belt Civics, replace the timing belt and tensioner at the same time",
      "Do not reuse old coolant if it is contaminated or rusty",
    ],
    steps: [
      "Identify the engine code before ordering parts and beginning teardown",
      "Drain the cooling system and remove the necessary covers or accessory belt hardware",
      "If timing-belt driven, set engine timing marks before removing the belt",
      "Remove the old pump, clean the mounting surface, and install the new pump with the correct gasket or O-ring",
      "Reassemble timing or accessory components, refill with Honda coolant, and bleed the cooling system fully",
    ],
    torqueSpecs: "Pump bolts vary by engine - verify in service manual before final tightening",
    vehicleNotes: [
      "D16, B-series, and many early 2000s Civic engines use a timing-belt-driven water pump, making this a timing service job",
      "R18 Civics use a different front cover layout, so do not assume all Civic pumps swap the same way",
      "Persistent overheating after pump replacement usually means trapped air or a thermostat issue, not a bad new pump",
      "Use Honda Type 2 coolant to avoid gasket and corrosion problems in the aluminum block and head",
    ],
  },

  "honda-civic::spark-plug-replacement": {
    difficulty: "Easy to Intermediate",
    time: "30-60 minutes",
    parts: [
      { name: "Spark Plugs", aftermarket: "NGK or Denso equivalent", spec: "4 plugs - verify engine-specific heat range" },
    ],
    tools: ["5/8 inch spark plug socket", "Extension", "Torque wrench", "10mm socket for coil engines"],
    warnings: [
      "Older Civics may use plug wires while newer ones use coil-on-plug - verify ignition layout before starting",
      "Do not install platinum or iridium plugs in the wrong heat range just because they thread in",
      "Always start the plugs by hand to protect the aluminum head",
    ],
    steps: [
      "Remove the engine cover or plug wire cover if equipped",
      "Disconnect plug wires or ignition coils one at a time to avoid mixing up cylinder order",
      "Remove the old plug, inspect color and wear, and compare to the new plug",
      "Install the new plugs to torque spec and reconnect wires or coils in the same order",
      "Start the engine and confirm no misfire or check-engine light is present",
    ],
    torqueSpecs: "Spark plugs: 13 ft-lbs typical for aluminum Honda heads",
    vehicleNotes: [
      "Most Civics are simple 4-plug jobs and often rank well because owners search exact year/model plug intervals",
      "R18 and K20 Civic engines are sensitive to cheap ignition parts - stick with NGK or Denso",
      "If you find oil around the plugs, plan a valve cover gasket and tube seal job soon",
      "A rough idle after plug replacement usually means one coil or wire is not fully seated",
    ],
  },

  "honda-accord::spark-plug-replacement": {
    difficulty: "Intermediate",
    time: "45-120 minutes",
    parts: [
      { name: "Spark Plugs", aftermarket: "NGK / Denso OEM-equivalent", spec: "4 plugs on 4-cylinder, 6 plugs on V6" },
    ],
    tools: ["5/8 inch spark plug socket", "Extensions", "Torque wrench", "10mm socket"],
    warnings: [
      "V6 Accords are far more time-consuming than 4-cylinder cars because the rear bank is against the firewall",
      "Use the exact plug type for your engine - J-series V6 and K-series 4-cylinder do not share the same plug spec",
      "Do not force rear-bank coils or connectors; the plastic gets brittle with age",
    ],
    steps: [
      "Identify whether the car is a 4-cylinder or V6 before ordering parts",
      "Remove covers, unplug coils, and work front bank plugs first",
      "On V6 models, move wiring and intake pieces as needed to access the rear bank safely",
      "Install new plugs by hand and torque evenly across all cylinders",
      "Reassemble coils and covers, then verify a smooth idle under load",
    ],
    torqueSpecs: "Spark plugs: 13 ft-lbs typical",
    vehicleNotes: [
      "4-cylinder Accord plug jobs are straightforward; V6 plug jobs win because many owners want rear-bank guidance",
      "Rear-bank access on J-series V6 engines is the main source of DIY frustration",
      "Misfire codes after replacement usually indicate a loose coil connector, not a bad new plug",
      "If the plugs are oil-fouled, inspect valve cover gaskets and tube seals before blaming the rings",
    ],
  },

  "honda-pilot::alternator-replacement": {
    difficulty: "Intermediate",
    time: "1.5-3 hours",
    parts: [
      { name: "Alternator", aftermarket: "Denso / Remy equivalent", spec: "Match engine and amp rating" },
      { name: "Serpentine belt", spec: "Inspect and replace if glazed or cracked" },
    ],
    tools: ["Serpentine belt tool", "12mm and 14mm sockets", "Long extension", "Multimeter"],
    warnings: [
      "Disconnect the battery before touching the alternator B+ cable",
      "A weak battery can destroy a new alternator if you install the alternator first and ignore the battery condition",
      "Take a belt-routing photo before removal if the underhood sticker is missing",
    ],
    steps: [
      "Disconnect the battery and release the serpentine belt tensioner",
      "Remove the belt from the alternator pulley and unplug the electrical connectors",
      "Remove the alternator mounting bolts and maneuver the unit out through the available front-side opening",
      "Install the new alternator, reconnect wiring, and reinstall the belt with correct routing",
      "Start the engine and verify charging output is in the normal range",
    ],
    torqueSpecs: "Alternator mounting bolts: verify by engine; do not overtighten aluminum bracket threads",
    vehicleNotes: [
      "Many Pilots use the J35 V6, so space is tighter than on a compact Honda",
      "Charging voltage should normally land around 13.5-14.5V with a healthy battery",
      "A slipping serpentine belt can mimic alternator failure with battery and charging-system lights",
      "If the alternator fails repeatedly, inspect for oil leaks soaking the unit from the valve cover or VTEC spool area",
    ],
  },

  // ─── Ford F-150 / Fusion ────────────────────────────────────────────────

  "ford-f-150::oil-change": {
    difficulty: "Easy",
    time: "20-35 minutes",
    parts: [
      { name: "Engine Oil", spec: "5W-20 or 5W-30 depending on engine and year - verify on oil cap" },
      { name: "Oil Filter", aftermarket: "Motorcraft FL-820S / FL-500S depending on engine", spec: "Use the correct filter for your engine family" },
      { name: "Drain plug washer", spec: "Replace if damaged or leaking" },
    ],
    torqueSpecs: "Drain plug torque varies by pan style - verify before final tightening",
    vehicleNotes: [
      "F-150s span many engines, so oil weight and filter change by year and displacement",
      "The common Ford truck filters are FL-820S and FL-500S - do not guess by thread size alone",
      "Turbo EcoBoost trucks often benefit from shorter oil intervals than Ford's longest advertised interval",
      "Check the skid plate or splash shield hardware before the first DIY oil change on 4x4 trucks",
    ],
    steps: [
      "Verify engine and oil spec from the oil cap or owner's manual",
      "Drain the oil completely and inspect the drain plug and washer",
      "Replace the filter with the correct Motorcraft or equivalent filter",
      "Refill with the proper oil weight and quantity, then verify the level after a short run",
    ],
  },

  "ford-f-150::thermostat-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Thermostat", aftermarket: "Motorad / Motorcraft equivalent", spec: "Match engine family" },
      { name: "Thermostat housing gasket or O-ring", spec: "Replace every time the housing is opened" },
      { name: "Motorcraft yellow coolant", spec: "Use correct Ford coolant for your year" },
    ],
    tools: ["Socket set", "Drain pan", "Gasket scraper", "Torque wrench"],
    warnings: [
      "Ford truck thermostat housings vary by engine - some are plastic and crack easily if overtightened",
      "Do not mix old orange coolant with newer yellow coolant without fully flushing the system",
      "Bleed trapped air carefully because air pockets can mimic a stuck thermostat",
    ],
    steps: [
      "Drain enough coolant to get below the thermostat housing",
      "Remove the upper hose and housing bolts, then note the thermostat orientation",
      "Clean the mating surface and install the new thermostat with a fresh gasket or O-ring",
      "Reassemble the housing, refill coolant, and run the heater to help purge air",
      "Verify normal warm-up and stable temperature under a road test",
    ],
    torqueSpecs: "Housing bolts: light torque only on plastic housings",
    vehicleNotes: [
      "F-150 thermostat searches repeat because truck owners often diagnose slow warm-up or intermittent overheating",
      "Plastic housings on later trucks can warp - if the housing is stained or cracked, replace it with the thermostat",
      "A coolant temp sensor problem can mimic thermostat symptoms, so scan live temp data when possible",
      "Trucks that tow heavily should get the cooling system fully bled and road-tested under load after repair",
    ],
  },

  "ford-f-150::starter-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Motorcraft / Remy equivalent", spec: "Verify engine and drivetrain" },
    ],
    tools: ["Socket set", "Long extension", "Floor jack", "Battery terminal wrench"],
    warnings: [
      "Disconnect the battery before touching the starter cable",
      "Some 4x4 trucks have tighter starter access around the front driveshaft or crossmember",
      "A bad starter relay or weak battery can mimic starter failure - test before replacing",
    ],
    steps: [
      "Disconnect the battery and raise the truck safely if underbody access is needed",
      "Remove the main cable and trigger wire from the starter solenoid",
      "Remove the starter mounting bolts and lower the old unit out of the bellhousing area",
      "Install the new starter, reconnect cables, and confirm a strong crank on multiple starts",
    ],
    torqueSpecs: "Starter bolts: verify for engine family; bellhousing threads can be damaged by overtorque",
    vehicleNotes: [
      "F-150 starter jobs often rank because truck owners keep these trucks long enough to see repeated no-crank issues",
      "Heat-soak failures after a highway drive are a classic starter symptom on older trucks",
      "Corroded battery grounds and swollen positive cables are common on work trucks and should be checked with the starter",
      "If the starter spins but does not engage, inspect the flywheel ring gear before installing another unit",
    ],
  },

  "ford-fusion::oil-change": {
    difficulty: "Easy",
    time: "20-30 minutes",
    parts: [
      { name: "Engine Oil", spec: "Most 4-cylinder Fusion engines use 5W-20 or 5W-30 - verify the cap" },
      { name: "Oil Filter", aftermarket: "Motorcraft FL-910S / FL-400S depending on engine" },
    ],
    torqueSpecs: "Drain plug torque varies by engine pan",
    vehicleNotes: [
      "Fusion oil-change winners suggest owners were searching exact year-model DIY maintenance pages",
      "Ford 2.5L and EcoBoost engines do not always share the same oil requirement, so verify before filling",
      "EcoBoost engines benefit from quality full synthetic oil and shorter intervals than maximum marketing numbers",
      "Check the undertray hardware before starting - stripped splash shield fasteners waste the most time on this job",
    ],
    steps: [
      "Confirm engine and oil spec, then drain the oil completely",
      "Replace the filter with the correct Motorcraft or OEM-equivalent filter",
      "Fill to the specified capacity and verify the level after a short run",
    ],
  },

  "ford-fusion::starter-replacement": {
    difficulty: "Intermediate",
    time: "1.5-2.5 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Motorcraft / Remy equivalent", spec: "Verify by engine" },
    ],
    tools: ["Socket set", "Extensions", "Jack and stands", "Battery wrench"],
    warnings: [
      "Disconnect the battery first and keep the positive cable isolated",
      "Starter access is tighter on some 4-cylinder transaxle layouts, so be patient with extensions and wiring clearance",
      "If the car only clicks once, load-test the battery before condemning the starter",
    ],
    steps: [
      "Disconnect the battery and remove splash shielding if needed",
      "Unplug the solenoid trigger wire and remove the main battery cable",
      "Remove the starter bolts and slide the starter out from the transmission side",
      "Install the new unit, reconnect cables, and verify repeated clean starts",
    ],
    torqueSpecs: "Starter bolts: medium torque; do not strip aluminum transaxle threads",
    vehicleNotes: [
      "Fusion starter pages repeated late in the run-up, especially around no-crank commuter-car searches",
      "Heat and road salt corrosion around the starter terminals are common on older Fusion models",
      "If the starter replacement does not fix the issue, inspect the transmission range sensor and battery grounds",
      "A dragging starter often causes slow crank before total failure, not an instant dead-start condition",
    ],
  },

  "ford-edge::starter-replacement": {
    difficulty: "Intermediate",
    time: "2-3 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Motorcraft / Remy equivalent", spec: "Match engine size" },
    ],
    tools: ["Socket set", "Extensions", "Floor jack", "Trim clip tool for splash shields"],
    warnings: [
      "Space is tighter than on a sedan because of the crossover subframe and underbody shields",
      "Disconnect battery before touching the starter cable",
      "Do not overlook battery condition and grounds on vehicles with start/stop or high accessory load",
    ],
    steps: [
      "Disconnect the battery and remove the lower splash shield for access",
      "Disconnect the starter wiring and remove the mounting bolts",
      "Work the old starter out carefully around the transmission case and nearby braces",
      "Install the replacement, reconnect wiring, and confirm strong hot and cold starts",
    ],
    vehicleNotes: [
      "Edge starter failures often present as intermittent clicks before full failure",
      "Salt-belt corrosion on wiring and grounds can cause starter-like symptoms",
      "Keep an eye on splash shield fasteners - stripped shields are common on daily-driven crossovers",
      "If cranking remains weak after replacement, battery and charging tests should come next",
    ],
  },

  "ford-focus::starter-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Motorcraft / Remy equivalent", spec: "Verify engine and transmission" },
    ],
    tools: ["Socket set", "Extensions", "Floor jack", "Battery wrench"],
    warnings: [
      "Disconnect battery first",
      "Manual and automatic Focus layouts can change access path around the transaxle",
      "Bad grounds and battery corrosion are common on older Focus cars and should be checked before ordering parts",
    ],
    steps: [
      "Disconnect the battery and raise the vehicle if needed for lower access",
      "Remove the starter wiring and mounting bolts",
      "Swap the starter through the transaxle-side opening and reconnect all cables securely",
      "Test several starts and verify cranking speed is restored",
    ],
    torqueSpecs: "Starter bolts: verify by engine family",
    vehicleNotes: [
      "Focus starter pages repeated during the run-up even when the exact years varied, which is a strong signal of recurring demand",
      "Intermittent no-crank with a good battery is the classic Focus starter symptom",
      "If the new starter sounds harsh or misaligned, stop and inspect ring-gear engagement",
      "A poor engine ground strap can mimic a weak starter on older compact Fords",
    ],
  },

  // ─── Toyota Corolla / Tacoma / Camry / RAV4 ─────────────────────────────

  "toyota-corolla::starter-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Denso / Remy equivalent", spec: "Verify by engine year" },
    ],
    tools: ["Socket set", "Extensions", "Battery wrench"],
    warnings: [
      "Disconnect the battery before removing the main starter cable",
      "Starter access changes between 1ZZ, 1.8L, and newer Corolla layouts",
      "A weak battery can cause the same click-no-crank symptom as a failing starter",
    ],
    steps: [
      "Disconnect the battery negative cable",
      "Remove intake pieces if they block access to the starter on your engine layout",
      "Disconnect the trigger wire and main power cable, then remove the mounting bolts",
      "Install the replacement starter and verify repeated clean starts",
    ],
    torqueSpecs: "Starter bolts: verify by engine family",
    vehicleNotes: [
      "Corolla starter pages were one of the clearest late-February winners, so deeper starter guidance should pay off",
      "Denso is the safest replacement brand on Toyota electrical systems",
      "A starter that only fails hot is common and points to solenoid wear",
      "If the engine cranks but does not start, the starter was never the main problem",
    ],
  },

  "toyota-corolla::thermostat-replacement": {
    difficulty: "Intermediate",
    time: "1-1.5 hours",
    parts: [
      { name: "Thermostat", aftermarket: "Aisin / Motorad equivalent", spec: "Use the correct temperature rating" },
      { name: "Thermostat gasket or O-ring", spec: "Replace every time" },
      { name: "Toyota Super Long Life Coolant", spec: "Pink premix" },
    ],
    tools: ["Socket set", "Drain pan", "Pliers", "Torque wrench"],
    warnings: [
      "Toyota uses pink Super Long Life Coolant - do not top up with universal green coolant",
      "Many Corolla thermostat housings sit low and trap coolant, so have the pan ready before loosening bolts",
      "An overheating Corolla can also have a weak radiator fan or water pump - do not assume thermostat every time",
    ],
    steps: [
      "Drain enough coolant to drop the level below the thermostat housing",
      "Remove the housing and note the thermostat jiggle valve orientation",
      "Install the new thermostat with fresh seal and correct orientation",
      "Refill with Toyota pink coolant and bleed air fully before road test",
    ],
    torqueSpecs: "Thermostat housing bolts: light torque only",
    vehicleNotes: [
      "Toyota Corolla thermostat pages repeated across the run-up, which makes this a core cluster to deepen",
      "The jiggle valve orientation matters on many Toyota thermostats for proper air bleeding",
      "A Corolla that overheats only at idle may have a fan issue rather than a thermostat issue",
      "Use Aisin if possible - it is the closest to Toyota OEM cooling hardware",
    ],
  },

  "toyota-corolla::spark-plug-replacement": {
    difficulty: "Easy to Intermediate",
    time: "30-60 minutes",
    parts: [
      { name: "Spark Plugs", aftermarket: "NGK / Denso iridium", spec: "4 plugs, verify engine-specific part number" },
    ],
    tools: ["5/8 inch spark plug socket", "10mm socket", "Extension", "Torque wrench"],
    warnings: [
      "Coil-on-plug Corollas require unplugging one coil at a time to keep connectors organized",
      "Do not gap fine-wire iridium plugs with force",
      "Work on a cool engine only",
    ],
    steps: [
      "Remove coil connectors and 10mm coil bolts",
      "Pull coils, remove old plugs, and inspect for oil or carbon tracking",
      "Install new plugs to torque spec and reinstall coils",
      "Start the engine and verify no misfire is present",
    ],
    torqueSpecs: "Spark plugs: verify by engine; do not overtighten aluminum head threads",
    vehicleNotes: [
      "Toyota Corolla spark-plug pages repeated both during the run-up and on Feb 28 itself",
      "Denso or NGK are the safe choices; off-brand plugs often cause idle quality complaints",
      "If a plug tube is oily, plan a valve cover gasket service",
      "Iridium plugs usually last a long time, so rough running after replacement usually points to coil issues or a connector left loose",
    ],
  },

  "toyota-tacoma::alternator-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Alternator", aftermarket: "Denso / Remy equivalent", spec: "Match engine and amp rating" },
      { name: "Drive belt", spec: "Inspect and replace if worn" },
    ],
    tools: ["Socket set", "Belt tool", "Multimeter", "Battery wrench"],
    warnings: [
      "Disconnect the battery first",
      "Do not assume all Tacoma engines use the same alternator case or amperage",
      "Oil or power-steering leaks can shorten alternator life if the unit gets soaked",
    ],
    steps: [
      "Disconnect the battery and relieve belt tension",
      "Remove the belt from the alternator pulley and disconnect the alternator wiring",
      "Remove mounting hardware and swap the alternator out of the front accessory area",
      "Install the new unit, tension the belt properly, and verify charging voltage",
    ],
    torqueSpecs: "Mounting bolts vary by engine; verify before final torque",
    vehicleNotes: [
      "Tacoma alternator searches repeated often enough to justify model-specific accessory-drive guidance",
      "A squealing belt or loose belt can mimic alternator failure with battery-light complaints",
      "Charging voltage should normally be in the mid-13 to mid-14 volt range",
      "Use Denso when possible; Toyota electrical systems tend to like OEM-equivalent alternators",
    ],
  },

  "toyota-tacoma::thermostat-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Thermostat", aftermarket: "Aisin / OEM-equivalent", spec: "Correct opening temp for your engine" },
      { name: "Gasket or O-ring", spec: "Replace with thermostat" },
      { name: "Toyota pink coolant", spec: "Super Long Life Coolant" },
    ],
    tools: ["Socket set", "Drain pan", "Pliers", "Torque wrench"],
    warnings: [
      "Do not mix coolant types",
      "Thermostat orientation matters - check the jiggle valve placement on Toyota applications",
      "Overheating under load can also point to radiator or fan-clutch problems",
    ],
    steps: [
      "Drain enough coolant to expose the thermostat housing",
      "Remove the housing and install the new thermostat in the correct orientation",
      "Reassemble with the new seal and refill with Toyota coolant",
      "Bleed the system and road-test under load",
    ],
    torqueSpecs: "Housing bolts: light torque",
    vehicleNotes: [
      "Tacoma thermostat pages repeated multiple times in the run-up and then resurfaced harder later",
      "Aisin is the safest thermostat choice on Toyotas",
      "If the truck still overheats on hills or while towing, inspect the radiator and clutch fan next",
      "Pink coolant and proper bleeding matter more than people think on Toyota cooling systems",
    ],
  },

  "toyota-tacoma::brake-pad-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Brake pads", aftermarket: "Akebono / Wagner / OEM-equivalent", spec: "Front or rear - verify axle" },
      { name: "Hardware kit", spec: "Recommended with pad replacement" },
      { name: "Brake grease", spec: "Use on slide and contact points only" },
    ],
    tools: ["Socket set", "C-clamp or piston tool", "Torque wrench", "Brake cleaner"],
    warnings: [
      "Tacoma front calipers can seize on older trucks - inspect slide pins and piston movement before just slapping in pads",
      "Always bed in new pads after installation",
      "Do not press the brake pedal with the caliper hanging free",
    ],
    steps: [
      "Remove the wheel and unbolt the caliper",
      "Inspect the rotor and slide hardware before compressing the piston",
      "Install new pads and hardware, then torque everything correctly",
      "Pump the pedal, check fluid level, and perform a proper bedding procedure",
    ],
    torqueSpecs: "Caliper hardware torque varies by axle and generation",
    vehicleNotes: [
      "Tacoma brake jobs trend because owners keep trucks long enough to see repeat front-brake wear",
      "Sticky front calipers are common on older Tacoma platforms and can destroy new pads quickly",
      "If the rotors are grooved or pulsating, do pads and rotors together",
      "Use quality pads - cheap truck pads squeal and dust heavily",
    ],
  },

  "toyota-camry::headlight-bulb-replacement": {
    difficulty: "Easy",
    time: "10-25 minutes",
    parts: [
      { name: "Headlight bulb", spec: "Commonly H11 low beam / 9005 high beam, but verify your year and trim" },
    ],
    tools: ["Gloves", "Flashlight"],
    warnings: [
      "Do not touch the bulb glass",
      "Some Camry trims have tighter passenger-side access near the washer neck or airbox",
      "Verify halogen vs HID before ordering bulbs",
    ],
    steps: [
      "Access the rear of the headlight housing from the engine bay",
      "Disconnect the bulb connector and twist the old bulb free",
      "Install the new bulb without touching the glass and lock it in place",
      "Reconnect the harness and test before closing the hood",
    ],
    vehicleNotes: [
      "Camry bulb pages repeated early in the run-up, which is typical high-intent DIY traffic",
      "Passenger-side access is often tighter, so move the washer neck or intake duct if needed",
      "Replace bulbs in pairs if brightness mismatch matters to you",
      "Cloudy lenses can make a good new bulb still look weak at night",
    ],
  },

  "toyota-rav4::brake-pad-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Brake pads", aftermarket: "Akebono / Wagner / OEM-equivalent", spec: "Verify front or rear axle" },
      { name: "Hardware kit", spec: "Recommended" },
    ],
    tools: ["Socket set", "Piston tool", "Brake cleaner", "Torque wrench"],
    warnings: [
      "Check rotor condition before compressing the piston",
      "Do not let the caliper hang by the brake hose",
      "Bed in pads properly after reassembly",
    ],
    steps: [
      "Remove the wheel and caliper",
      "Inspect slide pins and rotor condition, then compress the piston",
      "Install new pads with fresh hardware and brake lubricant at contact points",
      "Reassemble, pump the pedal, and bed in the brakes",
    ],
    torqueSpecs: "Caliper fastener torque varies by generation",
    vehicleNotes: [
      "RAV4 brake-pad pages showed late-February demand, so stronger RAV4 front-brake specifics are worth shipping",
      "If the RAV4 has electric parking brake in newer trims, follow the correct rear service mode procedure",
      "Akebono-style ceramic pads are a good fit for quieter daily-driver use",
      "If you feel pulsation, include rotors in the repair instead of doing pads only",
    ],
  },

  // ─── Hyundai / Kia / Nissan / Subaru / Chevrolet ────────────────────────

  "hyundai-elantra::spark-plug-replacement": {
    difficulty: "Easy to Intermediate",
    time: "30-60 minutes",
    parts: [
      { name: "Spark Plugs", aftermarket: "NGK / Denso iridium", spec: "4 plugs - verify engine family" },
    ],
    tools: ["5/8 inch spark plug socket", "10mm socket", "Extension", "Torque wrench"],
    warnings: [
      "Elantra engines are compact but straightforward - keep coil connectors organized",
      "Do not overtighten plugs in the aluminum head",
      "Use only OEM-quality plugs if you want stable idle and fuel trims",
    ],
    steps: [
      "Unplug and remove each ignition coil",
      "Remove the old plugs and inspect for oil or white lean deposits",
      "Install new plugs and torque properly",
      "Reinstall the coils and verify smooth running",
    ],
    torqueSpecs: "Spark plug torque varies by engine",
    vehicleNotes: [
      "Elantra spark-plug pages were direct Feb 28 winners, so this is one of the cleanest expansion targets",
      "If a plug tube is oily, plan a valve cover gasket service",
      "A rough idle after plug replacement usually points to a loose coil connector",
      "Do not mix plug brands across cylinders on Hyundai coil-on-plug engines",
    ],
  },

  "hyundai-elantra::starter-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Valeo / Remy equivalent", spec: "Verify engine and transmission" },
    ],
    tools: ["Socket set", "Extensions", "Battery wrench"],
    warnings: [
      "Disconnect the battery first",
      "Battery or ground issues can mimic a weak starter on compact Hyundais",
      "Make sure the starter wiring is fully seated before final reassembly",
    ],
    steps: [
      "Disconnect battery and gain access to the starter from above or below depending on layout",
      "Remove the trigger wire and main battery cable",
      "Unbolt the starter and install the replacement unit",
      "Reconnect wiring and confirm reliable starts hot and cold",
    ],
    torqueSpecs: "Starter bolts: verify by engine family",
    vehicleNotes: [
      "Elantra starter pages repeated late in the run-up, making them a good indexing-priority cluster",
      "Many no-crank cases are worsened by small battery capacity and dirty grounds",
      "If the starter free-spins, inspect engagement with the ring gear before ordering another unit",
      "Intermittent hot restart failure is a common starter symptom on older compact cars",
    ],
  },

  "hyundai-tucson::alternator-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Alternator", aftermarket: "Valeo / Remy equivalent", spec: "Verify engine and amp rating" },
      { name: "Drive belt", spec: "Inspect and replace if worn" },
    ],
    tools: ["Socket set", "Belt tool", "Multimeter"],
    warnings: [
      "Disconnect the battery first",
      "Belt tension and belt condition should be checked along with the alternator",
      "A weak battery can create charging complaints even with a good alternator",
    ],
    steps: [
      "Disconnect the battery and remove belt tension from the alternator pulley",
      "Disconnect the wiring and remove the mounting hardware",
      "Install the new alternator and restore belt routing and tension",
      "Start the engine and verify charging voltage",
    ],
    torqueSpecs: "Alternator fastener torque varies by engine",
    vehicleNotes: [
      "Tucson alternator pages appeared in the late-February winner set, so this one deserves model-specific content",
      "If you smell burning rubber, inspect the belt and tensioner before assuming the alternator failed first",
      "Use OEM-quality charging components on Hyundai/Kia products to avoid repeat failures",
      "Charging voltage should stabilize in the 13.5-14.5V range with accessories on",
    ],
  },

  "hyundai-santa-fe::spark-plug-replacement": {
    difficulty: "Intermediate",
    time: "45-120 minutes",
    parts: [
      { name: "Spark Plugs", aftermarket: "NGK / Denso OEM-equivalent", spec: "4 plugs on 4-cylinder, 6 on V6" },
    ],
    tools: ["Spark plug socket", "Extensions", "Torque wrench", "10mm socket"],
    warnings: [
      "V6 Santa Fe models are more time-consuming because of rear-bank access",
      "Do not force rear-bank coils or brackets near the firewall",
      "Use the correct plug type for your engine size",
    ],
    steps: [
      "Identify engine type before ordering plugs",
      "Remove engine covers and ignition coils, front bank first",
      "Install the new plugs by hand and torque to spec",
      "Reassemble coils and confirm a smooth idle under load",
    ],
    torqueSpecs: "Spark plug torque varies by engine",
    vehicleNotes: [
      "Santa Fe spark-plug pages repeated across the run-up and rose again near the end",
      "V6 rear-bank access is the main DIY sticking point and worth calling out explicitly",
      "If the engine shakes after the job, double-check every coil connector and vacuum line",
      "Stick with NGK or Denso-level parts quality for reliable ignition behavior",
    ],
  },

  "hyundai-sonata::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "20-35 minutes",
    parts: [
      { name: "Serpentine Belt", aftermarket: "Gates / Continental equivalent", spec: "Verify engine-specific length" },
    ],
    tools: ["Belt tool or breaker bar", "Flashlight"],
    warnings: [
      "Take a belt-routing photo before removal if the sticker is gone",
      "Inspect the tensioner and idlers if the old belt shows edge wear or glazing",
      "Do not force the belt over a pulley with a screwdriver",
    ],
    steps: [
      "Locate the tensioner and release belt tension",
      "Remove the old belt and compare length/rib count with the new one",
      "Route the new belt correctly and release the tensioner slowly",
      "Start the engine and verify the belt tracks cleanly on every pulley",
    ],
    torqueSpecs: "Accessory fastener torque varies by engine",
    vehicleNotes: [
      "Sonata serpentine-belt pages were one of the earliest recurring winners in the run-up",
      "Belt squeal after replacement usually points to a weak tensioner or misrouting",
      "Keep fingers clear when releasing the spring-loaded tensioner",
      "If belt dust is present, inspect every idler and accessory pulley bearing",
    ],
  },

  "hyundai-tucson::serpentine-belt-replacement": {
    difficulty: "Easy to Intermediate",
    time: "30-60 minutes",
    parts: [
      { name: "Serpentine Belt", aftermarket: "Gates / Continental equivalent", spec: "Verify by engine size and A/C equipment" },
      { name: "Tensioner or idler pulley", spec: "Inspect and replace if noisy or loose" },
    ],
    tools: ["Belt tool or breaker bar", "Flashlight", "Belt-routing sketch or phone photo"],
    warnings: [
      "Do not route the belt from memory - several Tucson engines have similar-looking accessory layouts",
      "If the belt failed suddenly, inspect every pulley before installing the new one",
      "Keep fingers clear of the spring-loaded tensioner while rotating it",
    ],
    steps: [
      "Photograph the current belt routing before removal",
      "Rotate the tensioner to unload the belt and slip it off the easiest accessible pulley",
      "Compare the new belt length and rib count to the old one before installation",
      "Route the new belt around all pulleys except the final one, then rotate the tensioner and slip it into place",
      "Start the engine and verify the belt tracks centered with no chirp or wobble",
    ],
    torqueSpecs: "No major torque spec unless replacing tensioner hardware; verify by engine",
    vehicleNotes: [
      "Tucson serpentine-belt pages were in the second wave of recurring Hyundai winners, so adding belt-specific detail helps the cluster",
      "A belt squeal right after startup often points to weak tension or contamination, not belt quality alone",
      "If the alternator pulley freewheels roughly, replace it before the new belt gets damaged",
      "Use a routing photo because some Hyundai four-cylinder layouts are easy to misroute around the idler",
    ],
  },

  "nissan-pathfinder::thermostat-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Thermostat", aftermarket: "Nissan / Aisin equivalent", spec: "Match engine family" },
      { name: "Thermostat seal", spec: "Replace with thermostat" },
      { name: "Nissan blue coolant", spec: "Use correct long-life coolant" },
    ],
    tools: ["Socket set", "Drain pan", "Pliers", "Torque wrench"],
    warnings: [
      "Use the right Nissan coolant and bleed the system carefully",
      "A Pathfinder that overheats under load can also have radiator or fan-clutch issues",
      "Do not overtighten thermostat housing bolts on older castings or plastic housings",
    ],
    steps: [
      "Drain enough coolant to expose the thermostat housing",
      "Remove the housing and replace the thermostat and seal",
      "Refill with the proper coolant and bleed the system fully",
      "Road-test and confirm normal operating temperature",
    ],
    torqueSpecs: "Housing bolts: light to medium torque only",
    vehicleNotes: [
      "Pathfinder thermostat pages repeated during the run-up, especially around practical overheating searches",
      "A heater that blows cold with a hot gauge often means trapped air or low coolant",
      "If temp spikes only on hills, inspect radiator flow and fan performance in addition to the thermostat",
      "Use OEM-quality cooling parts on Nissans to avoid repeat work",
    ],
  },

  "kia-optima::thermostat-replacement": {
    difficulty: "Intermediate",
    time: "1-2 hours",
    parts: [
      { name: "Thermostat", aftermarket: "Motorad / OEM-equivalent", spec: "Verify engine application" },
      { name: "Seal or housing gasket", spec: "Replace with thermostat" },
      { name: "Hyundai/Kia coolant", spec: "Use the correct long-life coolant" },
    ],
    warnings: [
      "Do not mix coolant chemistries",
      "Plastic housings crack if overtightened",
      "Overheating can also be fan or water-pump related, not only thermostat-related",
    ],
    steps: [
      "Drain enough coolant to open the thermostat housing cleanly",
      "Replace the thermostat and seal in the correct orientation",
      "Refill with proper coolant and bleed air thoroughly",
      "Road-test and verify stable operating temperature",
    ],
    torqueSpecs: "Housing bolts: light torque only",
    vehicleNotes: [
      "Optima thermostat pages were repeated winners and should benefit from model-specific cooling notes",
      "Bleeding trapped air is critical on many transverse Hyundai/Kia cooling systems",
      "If the engine overheated badly before repair, pressure-test for head gasket issues afterwards",
      "A sticking cooling fan relay can mimic thermostat failure in traffic",
    ],
  },

  "kia-optima::starter-replacement": {
    difficulty: "Intermediate",
    time: "1-3 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "Denso / Remy OEM-equivalent", spec: "Verify by engine and transmission" },
    ],
    tools: ["Socket set", "Extensions", "Ratchet", "Jack and stands if lower access is required"],
    warnings: [
      "Disconnect the battery before touching the main starter cable",
      "Some Optima starters are tucked under the intake or near the radiator fan shroud - confirm access before ordering extra parts",
      "A weak battery or corroded ground can mimic a failing starter",
    ],
    steps: [
      "Disconnect the negative battery cable and remove any intake or splash-shield components blocking access",
      "Unplug the solenoid connector and remove the main battery cable from the starter",
      "Remove the starter mounting fasteners and work the unit out carefully through the available opening",
      "Install the replacement starter, reconnect the wiring, and confirm a solid crank before reassembly",
    ],
    torqueSpecs: "Starter bolts: medium to high torque depending on engine; verify before final tightening",
    vehicleNotes: [
      "Optima starter pages were part of the Kia cluster expansion and deserve their own troubleshooting notes",
      "If the engine clicks once but does not crank, measure voltage at the starter before assuming the motor is dead",
      "Oil leaks from above can contaminate the starter and shorten its life",
      "A dragging crank after replacement usually points to battery or cable issues, not a bad new starter",
    ],
  },

  "kia-optima::water-pump-replacement": {
    difficulty: "Intermediate to Advanced",
    time: "2-4 hours",
    parts: [
      { name: "Water Pump", aftermarket: "AISIN / Gates equivalent", spec: "Verify engine family" },
      { name: "Gasket or O-ring", spec: "Replace with pump" },
      { name: "Coolant", spec: "Correct Hyundai/Kia long-life coolant" },
    ],
    warnings: [
      "Pump access varies heavily by engine and whether the pump is belt-driven",
      "Do not reuse old coolant after a contamination event",
      "If the belt or tensioner is removed, inspect them closely before reassembly",
    ],
    steps: [
      "Drain the cooling system and remove the necessary belt and pulley hardware",
      "Remove the old pump and clean the mounting surface fully",
      "Install the new pump with the proper seal and reassemble the accessory drive",
      "Refill coolant, bleed air, and road-test until fans cycle normally",
    ],
    torqueSpecs: "Pump bolts: verify by engine; do not overtighten aluminum threads",
    vehicleNotes: [
      "Optima water-pump demand showed up repeatedly enough to justify deeper model guidance",
      "If you hear bearing noise before replacement, inspect belt alignment and tensioner condition too",
      "Persistent overheating after pump replacement usually means trapped air or a separate thermostat issue",
      "Use OEM-quality pumps; cheap remans often leak early",
    ],
  },

  "kia-sorento::water-pump-replacement": {
    difficulty: "Intermediate to Advanced",
    time: "2-4 hours",
    parts: [
      { name: "Water Pump", aftermarket: "AISIN / Gates equivalent", spec: "Verify engine and year" },
      { name: "Coolant", spec: "Correct Kia long-life coolant" },
    ],
    warnings: [
      "Sorento pump jobs vary significantly by engine, so verify the exact engine before ordering parts",
      "Do not continue driving an overheating Sorento after a pump failure - head damage happens quickly",
      "Inspect idlers and the drive belt whenever you are deep in the accessory drive",
    ],
    steps: [
      "Drain the cooling system and remove access-limiting drive components",
      "Swap the old pump for the new unit with the correct sealing method",
      "Reassemble the belt path, refill coolant, and bleed thoroughly",
      "Confirm stable temperature on a road test with the heater on",
    ],
    torqueSpecs: "Pump hardware torque varies by engine",
    vehicleNotes: [
      "Sorento water-pump pages spiked more than once during the run-up, especially older-year variants",
      "Use this page to call out engine verification because Sorento engine families vary widely by year",
      "A coolant smell with no visible leak may still point to weep-hole seepage at the pump",
      "If a timing-belt engine is involved, pair the pump with timing service work",
    ],
  },

  "subaru-outback::water-pump-replacement": {
    difficulty: "Advanced",
    time: "3-5 hours",
    parts: [
      { name: "Water Pump", aftermarket: "AISIN", spec: "Recommended for Subaru EJ engines" },
      { name: "Timing belt kit", spec: "Strongly recommended on timing-belt Subaru engines" },
      { name: "Subaru coolant", spec: "Use correct coolant and conditioner if required by year" },
    ],
    warnings: [
      "Many Outback water pump jobs are timing-belt jobs - do not separate them unless the service was just done",
      "Mark timing carefully before disassembly",
      "Subaru boxer engines trap air easily if the cooling system is refilled carelessly",
    ],
    steps: [
      "Drain the cooling system and remove timing covers or front access hardware as required",
      "Set timing marks if working on a timing-belt-driven Subaru engine",
      "Replace the water pump and gasket, then reinstall timing components correctly",
      "Refill and bleed the system carefully, then road-test for stable temperature",
    ],
    torqueSpecs: "Pump and timing hardware torque must follow engine-specific Subaru specs",
    vehicleNotes: [
      "Outback water-pump pages were direct run-up winners, making this one of the best places to add boxer-specific guidance",
      "On EJ engines, doing the pump without timing components is usually false economy",
      "If overheating continues, inspect radiator flow and head-gasket history immediately",
      "Use Aisin or OEM-quality cooling parts on Subarus to avoid repeat leaks",
    ],
  },

  "chevrolet-impala::headlight-bulb-replacement": {
    difficulty: "Easy to Intermediate",
    time: "15-45 minutes",
    parts: [
      { name: "Headlight bulb", spec: "Varies by year and trim - verify low and high beam sizes before ordering" },
    ],
    warnings: [
      "Some Impala generations have straightforward rear access, others require partial headlamp or splash-shield access",
      "Do not touch the bulb glass",
      "Verify halogen vs HID before ordering parts",
    ],
    steps: [
      "Access the rear of the headlight assembly from the engine bay or service panel area",
      "Disconnect the old bulb and remove it from the housing",
      "Install the new bulb without touching the glass and test it before full reassembly",
    ],
    vehicleNotes: [
      "Impala headlight-bulb pages were winners in the late-February set and benefit from model-specific access notes",
      "Passenger-side access is often tighter and may require moving the airbox or washer neck",
      "Clouded lenses can make a good new bulb still appear dim",
      "If one bulb failed from age, the other is usually not far behind",
    ],
  },

  "chevrolet-impala::starter-replacement": {
    difficulty: "Intermediate",
    time: "1-3 hours",
    parts: [
      { name: "Starter Motor", aftermarket: "ACDelco / Denso equivalent", spec: "Verify engine and stop-start equipment" },
    ],
    tools: ["Socket set", "Extensions", "Jack and stands", "Creeper or pad for lower access"],
    warnings: [
      "Disconnect the battery before removing the starter power lead",
      "Some Impala generations route the starter near the exhaust, so let the engine cool completely first",
      "A weak battery or bad ground can produce the same no-crank symptoms as a failed starter",
    ],
    steps: [
      "Disconnect the negative battery cable and raise the front of the vehicle safely",
      "Remove any splash shield or brace blocking access to the starter",
      "Disconnect the solenoid connector and main cable, then remove the starter mounting bolts",
      "Install the new starter, reconnect wiring, and test crank speed before reinstalling covers",
    ],
    torqueSpecs: "Starter bolts: verify by engine family; tighten securely and evenly",
    vehicleNotes: [
      "Impala starter pages complement the existing headlight and Malibu battery specs inside the Chevrolet winner pool",
      "Heat soak after a short stop can expose a weak starter before it fails completely",
      "If the old starter is oil-soaked, inspect the engine for valve cover or front cover leaks",
      "A rapid clicking noise usually points to voltage loss rather than a seized starter drive",
    ],
  },

  "chevrolet-malibu::battery-replacement": {
    difficulty: "Easy to Intermediate",
    time: "20-40 minutes",
    parts: [
      { name: "Battery", spec: "Verify group size by year and engine - many use Group 47/H5 or nearby sizes" },
    ],
    tools: ["10mm socket", "13mm socket", "Battery hold-down tool"],
    warnings: [
      "Some Malibu generations place braces or fuse boxes over the battery, so do not yank the battery out blindly",
      "Disconnect negative terminal first",
      "Retain any vent tube or shielding present on the original battery setup",
    ],
    steps: [
      "Remove any battery cover or brace blocking access",
      "Disconnect negative then positive cables and remove the hold-down",
      "Swap the battery, reconnect positive then negative, and verify clean starts",
    ],
    torqueSpecs: "Terminal bolts: snug only",
    vehicleNotes: [
      "Malibu battery pages showed enough late-runup demand to justify a better battery-access explanation",
      "Corrosion at the side-post or top-post connections can mimic a dead battery",
      "If warning lights remain after replacement, drive the car briefly and recheck charging voltage",
      "Keep memory settings in mind if the owner cares about radio presets or clock reset",
    ],
  },

  // ─── Jeep Grand Cherokee (2005-2010) ─────────────────────────────────────

  "jeep-grand-cherokee::serpentine-belt-replacement": {
    difficulty: "Easy",
    time: "15-25 minutes",
    parts: [
      { name: "Belt (3.7L V6)", aftermarket: "Gates K060720", spec: "6 rib" },
      { name: "Belt (5.7L HEMI V8)", aftermarket: "Gates K060864", spec: "6 rib — longer than V6" },
    ],
    tools: ["15mm wrench (tensioner)", "Belt routing sticker reference"],
    beltRouting: "5.7L HEMI: Crankshaft → AC compressor → power steering → water pump → alternator → spring tensioner → idler. 3.7L V6: Crankshaft → AC → PS → water pump → alternator → tensioner.",
    vehicleNotes: [
      "3.7L V6 and 5.7L HEMI use DIFFERENT belt lengths — K060720 vs K060864",
      "HEMI uses a slightly more complex routing with one additional idler pulley",
      "Tensioner bolt is 15mm, rotates clockwise to release on most years",
      "After battery disconnect, HEMI PCM may need idle relearn: idle with AC off for 10 minutes",
    ],
    steps: [
      "Verify engine (3.7L or 5.7L) and purchase correct belt",
      "Rotate 15mm tensioner clockwise to release",
      "Remove belt and route new belt per label in engine bay",
      "HEMI: extra idler pulley — use routing diagram carefully",
    ],
    torqueSpecs: "Tensioner bolt: 40 ft-lbs",
  },

  "jeep-grand-cherokee::oil-change": {
    difficulty: "Easy",
    time: "25-30 minutes",
    parts: [
      { name: "Engine Oil (3.7L)", spec: "5W-20 Mopar or equivalent — 5 quarts" },
      { name: "Engine Oil (5.7L HEMI)", spec: "5W-20 Mopar or equivalent — 7 quarts" },
      { name: "Oil Filter", oem: "05281090 (3.7L) / 05281090AB (HEMI)", aftermarket: "Mopar 5281090 / Fram PH3614" },
    ],
    torqueSpecs: "Drain plug: 20 ft-lbs (18mm)",
    vehicleNotes: [
      "5.7L HEMI holds 7 quarts — significantly more than most vehicles. Add 6.5 quarts, verify on dipstick",
      "Mopar specifies 5W-20 for both 3.7L and 5.7L HEMI in most years — do not use 10W-30",
      "After oil change on HEMI, run engine for 30 seconds, shut off, wait 5 minutes, check level — HEMI has large oil galleries",
      "Drain plug is 18mm on both V6 and V8",
    ],
    steps: [
      "Drain oil (18mm plug), replace drain plug",
      "Remove spin-on Mopar oil filter",
      "Fill to capacity (5 qt for 3.7L, 7 qt for HEMI)",
      "Run briefly, shut off, recheck level on dipstick",
    ],
  },

};

/**
 * Look up vehicle-specific repair spec.
 * Tries year-specific key first, falls back to make-model generic.
 */
export function getVehicleRepairSpec(
  year: string,
  make: string,
  model: string,
  task: string
): VehicleRepairSpec | null {
  const normalizedMake = make.toLowerCase().replace(/\s+/g, '-');
  const normalizedModel = model.toLowerCase().replace(/\s+/g, '-');
  const normalizedTask = task.toLowerCase();

  const yearKey = `${year}-${normalizedMake}-${normalizedModel}::${normalizedTask}`;
  const genericKey = `${normalizedMake}-${normalizedModel}::${normalizedTask}`;

  return VEHICLE_REPAIR_SPECS[yearKey] || VEHICLE_REPAIR_SPECS[genericKey] || null;
}
