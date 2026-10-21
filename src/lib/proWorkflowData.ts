/**
 * What the Pros Prefer — Professional Workflow & Essential Tool Matrix
 * Provides authentic, high-E-E-A-T mechanic tips, exact socket/tool sizes,
 * and milestone actions for core automotive repair tasks.
 */

export interface ProWorkflowStep {
  step: number;
  action: string;
  tool: string;
  toolQuery: string;
  tip: string;
}

export interface ProWorkflowPlan {
  title: string;
  subtitle: string;
  proMechanicNote: string;
  steps: ProWorkflowStep[];
}

const PRO_WORKFLOW_MAP: Record<string, (vehicleName: string) => ProWorkflowPlan> = {
  'brake-pad-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Brake Pad Workflow`,
    subtitle: 'Fast 4-step shop procedure, exact tool sizes, and professional mechanic tips.',
    proMechanicNote: 'Never let a loose brake caliper dangle by its flexible rubber brake hose. Hang it immediately from the suspension coil spring with an S-hook or wire coat hanger to prevent internal hose lining failure.',
    steps: [
      {
        step: 1,
        action: 'Wheel Removal & Lug Prep',
        tool: '19mm / 21mm Deep Socket & Torque Wrench',
        toolQuery: 'automotive torque wrench 1/2 inch drive 19mm 21mm deep socket',
        tip: 'Break lug nuts loose 1/2 turn while the tire is still touching the ground before raising on jack stands.',
      },
      {
        step: 2,
        action: 'Caliper Slide Pin Extraction',
        tool: '7mm / 8mm Hex (Allen) or 14mm Socket',
        toolQuery: 'brake caliper slide pin hex allen socket set metric',
        tip: 'Inspect rubber slide pin dust boots for tears. Thoroughly clean old gummed grease off pins before lubricating with silicone-based brake grease.',
      },
      {
        step: 3,
        action: 'Piston Compression & Caliper Hang',
        tool: 'Disc Brake Caliper Tool & S-Hooks',
        toolQuery: 'disc brake caliper tool piston compressor with hanger hooks',
        tip: 'Open the master cylinder cap slightly under the hood. Compress the caliper piston slowly and evenly to prevent fluid overflow or reservoir seal blowby.',
      },
      {
        step: 4,
        action: 'Hardware Prep & Pad Bedding',
        tool: 'Synthetic Ceramic Brake Grease & Wire Brush',
        toolQuery: 'synthetic ceramic brake grease brake cleaner wire brush kit',
        tip: 'Scrape bracket abutment channels with a wire brush until bare metal. Grease metal pad slide contact points only—never get grease on friction material or rotor face.',
      },
    ],
  }),

  'brake-rotor-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Brake Rotor Workflow`,
    subtitle: 'The 4-step rotor installation standard used by certified brake technicians.',
    proMechanicNote: 'Every 0.001 inch of rust scale or dirt left behind the rotor on the wheel hub surface creates 0.003+ inches of lateral runout, causing annoying brake pedal pulsation within 1,000 miles.',
    steps: [
      {
        step: 1,
        action: 'Caliper Carrier Bracket Removal',
        tool: '18mm / 19mm / 21mm Socket & 1/2" Breaker Bar',
        toolQuery: '1/2 inch drive breaker bar heavy duty metric impact socket set',
        tip: 'Caliper frame bracket bolts are torqued tight from the factory with threadlocker. A 24-inch breaker bar provides clean leverage without risking knuckle injury.',
      },
      {
        step: 2,
        action: 'Rotor Retaining Screw Extraction',
        tool: 'T30 Torx Bit (Manual Impact Screwdriver)',
        toolQuery: 'manual impact screwdriver set T30 torx brake rotor screw',
        tip: 'Rotor retaining screws seize easily. Set your T30 bit in the screw and give the back a sharp blow with a steel hammer to shock the threads loose before turning.',
      },
      {
        step: 3,
        action: 'Wheel Hub Face Decontamination',
        tool: 'Wire Cup Brush (Drill Attachment)',
        toolQuery: 'wire cup brush drill attachment for wheel hub rust removal',
        tip: 'Spin a wire brush over the wheel hub flange until it is 100% bare, shiny metal. Apply a microscopically thin film of anti-seize around the center pilot ring only.',
      },
      {
        step: 4,
        action: 'Protective Cosmoline Stripping',
        tool: 'Non-Chlorinated Brake Cleaner & Shop Towels',
        toolQuery: 'non chlorinated brake cleaner spray heavy duty shop towels',
        tip: 'Brand new bare-metal rotors are shipped coated in anti-rust oil. Spray both friction faces thoroughly with brake cleaner and wipe down before installing new pads.',
      },
    ],
  }),

  'oil-change': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Oil Service Workflow`,
    subtitle: 'Zero-mess shop procedure, drain plug safety, and filter gasket verification.',
    proMechanicNote: 'Always verify the old oil filter rubber O-ring came off on the old filter before spinning the new one on. "Double-gasketing" causes an immediate, catastrophic high-pressure oil blowout upon engine start.',
    steps: [
      {
        step: 1,
        action: 'Engine Warm-Up & Safe Lift',
        tool: 'Heavy-Duty Hydraulic Jack & Stands',
        toolQuery: 'automotive hydraulic floor jack and jack stands set',
        tip: 'Run the engine for 3 to 5 minutes before draining. Warm oil flows much faster and suspends sludge and microscopic carbon particles for a complete drain.',
      },
      {
        step: 2,
        action: 'Drain Plug Removal & Crush Washer',
        tool: '13mm / 14mm / 15mm Box-End Wrench (New Washer)',
        toolQuery: 'automotive combination box end wrench set metric oil drain plug crush washers',
        tip: 'Always replace the crush washer (aluminum or copper). Thread the drain plug in several turns by hand before applying a wrench to eliminate cross-threading.',
      },
      {
        step: 3,
        action: 'Oil Filter Spin-Off & Pre-Lube',
        tool: 'Cup-Style Oil Filter Wrench & Oil Drain Pan',
        toolQuery: 'cup style oil filter wrench set automotive large oil drain pan',
        tip: 'Coat the rubber gasket of the new filter with a film of clean motor oil. Hand-tighten until the gasket touches the engine flange, then turn 3/4 turn further—never overtighten with a tool.',
      },
      {
        step: 4,
        action: 'Refill & Level Verification',
        tool: 'Threaded No-Spill Engine Oil Funnel',
        toolQuery: 'automotive spill proof threaded oil funnel set',
        tip: 'Pour in 1/2 quart less than specified capacity first. Run engine 60 seconds, shut down on level ground for 3 minutes, then read dipstick to adjust to the top hash mark.',
      },
    ],
  }),

  'spark-plug-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Spark Plug Workflow`,
    subtitle: 'Precision plug replacement, coil boot protection, and aluminum head safety.',
    proMechanicNote: 'Never use a coin-style ramp gauge on modern fine-wire iridium or platinum spark plugs. Prying on the fine-wire center electrode will snap or fracture the delicate precious-metal tip instantly.',
    steps: [
      {
        step: 1,
        action: 'Debris Clearance & Coil Pack Removal',
        tool: '8mm / 10mm Socket & Canned Compressed Air',
        toolQuery: 'compressed air duster can automotive 1/4 inch ratchet 8mm 10mm socket set',
        tip: 'Blow compressed air around ignition coil boots before removing them. Road sand and gravel trapped in the spark plug wells will fall directly into open cylinders if not blown clear first.',
      },
      {
        step: 2,
        action: 'Magnetic Spark Plug Extraction',
        tool: '5/8" (16mm) or 14mm Thin-Wall Magnetic Socket',
        toolQuery: '14mm thin wall magnetic spark plug socket 5/8 inch swivel socket',
        tip: 'Use a magnetic plug socket with built-in swivel. The magnet prevents dropping the plug down the long well, which bends the electrode gap shut on impact.',
      },
      {
        step: 3,
        action: 'Electrode Gap Verification',
        tool: 'Wire-Loop Feeler Gauge',
        toolQuery: 'wire spark plug feeler gauge gapping tool',
        tip: 'Check gap against OEM factory spec using gentle wire-loop gauges. If adjustment is required, gently bend the ground strap without touching the center porcelain.',
      },
      {
        step: 4,
        action: 'Hand-Threading & Torque Wrench Tightening',
        tool: '3/8" Drive Torque Wrench (11–18 lb-ft)',
        toolQuery: '3/8 inch drive click torque wrench 10-80 ft lbs',
        tip: 'Hand-spin the extension bar by hand until the plug seats against cylinder head. Torque to factory specification—never guess on soft aluminum cylinder threads.',
      },
    ],
  }),

  'battery-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Battery Replacement Workflow`,
    subtitle: 'Terminal safety sequence, corrosion mitigation, and bracket security.',
    proMechanicNote: 'Always disconnect the NEGATIVE (black/-) cable FIRST, and reconnect it LAST. If your metal wrench slips while loosening the positive terminal when ground is already disconnected, no short-circuit arc or fire can occur.',
    steps: [
      {
        step: 1,
        action: 'Negative Terminal Disconnection',
        tool: '10mm Wrench or Battery Terminal Pliers',
        toolQuery: '10mm ratcheting wrench battery terminal tool',
        tip: 'Tuck the detached negative cable aside so it cannot spring back and accidentally touch the battery negative post while you work.',
      },
      {
        step: 2,
        action: 'Positive Cable & Hold-Down Bracket',
        tool: '10mm / 13mm Deep Socket with 6" Extension',
        toolQuery: '3/8 drive deep socket 10mm 13mm with 6 inch extension',
        tip: 'Hold-down j-bolts and brackets corrode rapidly from acid vapors. Spray threads with penetrating oil 5 minutes prior to turning to prevent snapped studs.',
      },
      {
        step: 3,
        action: 'Terminal & Cable End Decontamination',
        tool: 'Battery Post & Terminal Wire Brush',
        toolQuery: 'battery terminal and post cleaner wire brush tool',
        tip: 'Scrape internal cable clamp surfaces until bright shiny metal shows. Even a microscopic layer of oxidation creates high electrical resistance and false starting failure.',
      },
      {
        step: 4,
        action: 'Terminal Installation & Anti-Corrosion Seal',
        tool: 'Battery Anti-Corrosion Washers & Protective Spray',
        toolQuery: 'battery terminal anti corrosion protector spray and felt washers',
        tip: 'Install the POSITIVE terminal first, then the NEGATIVE terminal last. Snug terminals until they cannot be twisted by hand, then coat exposed lead in protector spray.',
      },
    ],
  }),

  'alternator-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Alternator Workflow`,
    subtitle: 'Battery isolation, tensioner release, and electrical ground verification.',
    proMechanicNote: 'The large B+ output post on the alternator is connected directly to the vehicle battery without a fuse on many vehicles. Forgetting to disconnect the battery ground first will weld your ratchet to the engine block.',
    steps: [
      {
        step: 1,
        action: 'Complete Battery Power Isolation',
        tool: '10mm Wrench',
        toolQuery: '10mm combination wrench automotive',
        tip: 'Disconnect the battery negative terminal before touching any alternator hardware. Wrap cable end in an insulated rag.',
      },
      {
        step: 2,
        action: 'Belt Tensioner De-Tensioning',
        tool: 'Serpentine Belt Tensioner Tool Kit',
        toolQuery: 'serpentine belt tool kit long handle with shallow sockets',
        tip: 'Snap a smartphone photo of the belt path across all pulleys. Release tensioner smoothly—avoid letting the tensioner arm snap back under spring pressure.',
      },
      {
        step: 3,
        action: 'Wiring Harness & Mounting Bolts Removal',
        tool: '10mm / 12mm / 14mm / 15mm Metric Sockets',
        toolQuery: 'metric 3/8 drive 6 point socket set shallow and deep',
        tip: 'Unclip plastic connector latches gently using a flat pick. Wire-brush the alternator mounting bracket faces to ensure flawless metal-to-metal chassis grounding.',
      },
      {
        step: 4,
        action: 'Torque & Charging Voltage Verification',
        tool: 'Digital Multimeter & Torque Wrench',
        toolQuery: 'automotive digital multimeter 6000 counts volt tester',
        tip: 'Start vehicle and measure voltage across battery posts with high beams and cabin blower on maximum. Proper charging voltage should read between 13.8V and 14.5V.',
      },
    ],
  }),

  'serpentine-belt-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Serpentine Belt Workflow`,
    subtitle: 'Routing diagram verification, pulley bearing inspection, and rib alignment.',
    proMechanicNote: 'After installing the new belt, verify that every single V-rib is centered perfectly inside the pulley grooves on every accessory. If even one rib hangs off the edge of a pulley, the belt will split or shred within 60 seconds.',
    steps: [
      {
        step: 1,
        action: 'Diagram Verification & Digital Snapshot',
        tool: 'Smartphone Camera or Inspection Mirror',
        toolQuery: 'telescopic inspection mirror with LED light',
        tip: 'Always photograph the exact routing over and under grooved vs. smooth pulleys before loosening tension. Factory under-hood stickers are often missing or damaged.',
      },
      {
        step: 2,
        action: 'Tensioner Arm Rotation & Belt Release',
        tool: 'Long-Handle Serpentine Belt Tool Bar',
        toolQuery: 'universal serpentine belt tool bar with adapters',
        tip: 'Use a slim, long-reach bar to clear tight engine bay clearances between engine pulleys and inner fender sheet metal.',
      },
      {
        step: 3,
        action: 'Idler & Accessory Pulley Bearing Check',
        tool: 'Hand Inspection & Mechanic Stethoscope',
        toolQuery: 'automotive mechanic stethoscope diagnostic tool',
        tip: 'Spin every idler pulley, tensioner pulley, alternator, and water pump by hand. Any rough grinding feel, squeak, or lateral wobble indicates a failing bearing that will ruin the new belt.',
      },
      {
        step: 4,
        action: 'Groove Seating & Final Tracking Inspection',
        tool: 'High-Lumen LED Worklight',
        toolQuery: 'rechargeable magnetic slim LED automotive work light',
        tip: 'Route belt starting at crankshaft, leaving the smooth water pump or idler pulley as the final slip-on point. Bump starter once to confirm tracking before closing hood.',
      },
    ],
  }),

  'water-pump-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Water Pump Workflow`,
    subtitle: 'Controlled coolant capture, mating surface prep, and cooling system purging.',
    proMechanicNote: 'Never use steel razor blades or aggressive rotary wire wheels on soft aluminum engine blocks to remove old gasket material. Gouging the aluminum creates microscopic channels that cause permanent, unfixable coolant leaks.',
    steps: [
      {
        step: 1,
        action: 'Pulley Bolt Pre-Loosening & Coolant Drain',
        tool: '10mm / 12mm Wrench & Large Drain Pan',
        toolQuery: 'automotive coolant drain pan 15 quart large capacity',
        tip: 'Loosen the water pump pulley mounting bolts 1 turn while the serpentine belt is still under full tension. The belt grip prevents the pulley from spinning freely in your hand.',
      },
      {
        step: 2,
        action: 'Pump Extraction & Catch Pan Placement',
        tool: 'Metric 6-Point Socket Set & Ratchet',
        toolQuery: '3/8 inch drive 6 point metric shallow socket set',
        tip: 'Place your drain bucket directly beneath the pump before unbolting. Significant trapped coolant remains behind the pump cavity even after draining the radiator.',
      },
      {
        step: 3,
        action: 'Mating Surface Decontamination',
        tool: 'Plastic / Brass Razor Blade Scraper & Brake Cleaner',
        toolQuery: 'plastic razor blade scraper tool for gasket removal',
        tip: 'Scrape all residual paper and dried RTV until the aluminum surface is clean, smooth, and dry. Wipe with brake cleaner so the new gasket bonds flat.',
      },
      {
        step: 4,
        action: 'Torque Pattern & Air Bleed Funnel',
        tool: '1/4" Drive Torque Wrench (in-lbs) & Burp Funnel',
        toolQuery: 'spill free no spill coolant filling funnel kit with adapters',
        tip: 'Small M6 and M8 water pump bolts have low torque ratings (7–15 lb-ft). Overtightening snaps bolts in the block. Use a spill-free funnel to purge air pockets on refill.',
      },
    ],
  }),

  'transmission-fluid-change': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Transmission Service Workflow`,
    subtitle: 'Fill plug verification, measured fluid capture, and operating temperature level check.',
    proMechanicNote: 'ALWAYS loosen and remove the transmission FILL plug or check plug BEFORE loosening the drain plug. If you drain all the fluid and then discover the fill plug is seized or stripped, the car cannot be driven or filled.',
    steps: [
      {
        step: 1,
        action: 'Level Stance & Fill Plug Verification',
        tool: '8mm / 10mm Hex / Torx Bit or Box Wrench',
        toolQuery: 'automotive hex bit socket set 3/8 drive metric and standard',
        tip: 'Ensure the vehicle is 100% level on 4 jack stands or a lift. Crack the fill plug loose first to guarantee you have a clear pathway to refill fresh fluid.',
      },
      {
        step: 2,
        action: 'Controlled Drain & Graduated Volume Capture',
        tool: 'Graduated Fluid Drain Bucket & New Crush Washer',
        toolQuery: 'graduated automotive oil measuring container with pour spout',
        tip: 'Drain fluid into a clean container with quart/liter measurement markings. Knowing the exact volume drained down to the ounce gives you an exact initial refill baseline.',
      },
      {
        step: 3,
        action: 'Fresh Fluid Refill',
        tool: 'Multi-Use Fluid Transfer Hand Pump',
        toolQuery: 'multi use automotive fluid transfer pump for transmission fluid gear oil',
        tip: 'Use an automotive transfer pump with clear tubing to feed fresh OEM-spec fluid into the transmission without air bubbles or external dirt contamination.',
      },
      {
        step: 4,
        action: 'Thermal Expansion Level Check',
        tool: 'OBD-II Scan Tool or Infrared Laser Thermometer',
        toolQuery: 'infrared thermometer laser temp gun automotive',
        tip: 'Transmission fluid expands significantly with heat. Start engine, cycle PRNDL gears holding each 3 seconds, and verify level at factory spec fluid temperature (typically 95°F–113°F).',
      },
    ],
  }),

  'cabin-air-filter-replacement': (vehicle) => ({
    title: `What the Pros Prefer: ${vehicle} Cabin Air Filter Workflow`,
    subtitle: 'Glovebox damper protection, leaf debris clearance, and airflow arrow orientation.',
    proMechanicNote: 'Always look at the printed airflow arrow on the old filter before discarding. Most systems flow from ceiling to floor (ARROW DOWN ↓), but some euro models flow forward or upward. Installing backwards crushes filter pleats.',
    steps: [
      {
        step: 1,
        action: 'Damper Cord Detachment',
        tool: 'Nylon Trim Pry Tool or Fingers',
        toolQuery: 'automotive nylon trim removal pry tool set',
        tip: 'Unhook the soft-drop damper cord on the right side of the glovebox first. Forcing the glovebox down without unhooking snaps the plastic damper arm.',
      },
      {
        step: 2,
        action: 'Glovebox Stopper Tab Release',
        tool: 'Gentle Inward Hand Pressure',
        toolQuery: 'rechargeable LED magnetic clip on work light',
        tip: 'Squeeze the left and right inner sidewalls of the glovebox firmly inward to clear the rubber stopping tabs, then let the glovebox swing downward freely.',
      },
      {
        step: 3,
        action: 'Filter Access Door & Cavity Vacuuming',
        tool: 'Small Shop Vacuum or Slender Crevice Tool',
        toolQuery: 'portable shop vacuum with automotive detailing kit',
        tip: 'Pine needles, dried leaves, and seeds sit on top of the old filter. Vacuum the shelf clean as you slide the old filter out so debris does not fall directly into the blower wheel.',
      },
      {
        step: 4,
        action: 'Activated Carbon Filter Alignment',
        tool: 'Activated Carbon Replacement Cabin Filter',
        toolQuery: 'activated carbon cabin air filter with baking soda',
        tip: 'Align the "AIR FLOW ↓" arrow to point toward the blower motor. Ensure filter pleats are not bunched or folded on the edges before snapping the access door shut.',
      },
    ],
  }),
};

export function getProWorkflowData(canonicalTask: string, vehicleName: string): ProWorkflowPlan | null {
  const factory = PRO_WORKFLOW_MAP[canonicalTask];
  if (factory) {
    return factory(vehicleName);
  }

  // Clean fallback for other tasks
  const cleanTaskName = canonicalTask.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `What the Pros Prefer: ${vehicleName} ${cleanTaskName}`,
    subtitle: 'Professional 4-step job flow, tool sizes, and certified technician best practices.',
    proMechanicNote: `Prioritize clean tool fitment and safety. Consult factory OEM service procedures for exact fastener torque specs before final assembly on your ${vehicleName}.`,
    steps: [
      {
        step: 1,
        action: 'Job Preparation & Access Clearance',
        tool: 'Metric Socket Set & Safety Glasses',
        toolQuery: `${vehicleName} metric socket set ratchet automotive safety glasses`,
        tip: 'Clear dust and road grime from the working area before loosening hardware. Protect eyes and hands from fluids and sharp metal edges.',
      },
      {
        step: 2,
        action: 'Fastener Extraction & Component Disassembly',
        tool: 'Box-End Wrenches & Penetrating Oil',
        toolQuery: `${vehicleName} combination wrench set penetrating oil spray`,
        tip: 'Apply penetrating spray to heat-cycled or rusted bolts 10 minutes prior to removal. Use 6-point sockets to avoid rounding off bolt heads.',
      },
      {
        step: 3,
        action: 'Mating Surface Inspection & Cleaning',
        tool: 'Wire Brush & Non-Chlorinated Solvent',
        toolQuery: 'wire brush set automotive parts cleaner solvent',
        tip: 'Clean all mounting surfaces to bare metal. Verify that old gaskets, O-rings, and crush washers are fully removed before installing new parts.',
      },
      {
        step: 4,
        action: 'Final Torque & Operational Verification',
        tool: 'Calibrated Click-Type Torque Wrench',
        toolQuery: 'automotive click torque wrench 3/8 drive',
        tip: 'Torque fasteners to factory OEM specifications in an alternating star or criss-cross pattern to ensure uniform clamping pressure.',
      },
    ],
  };
}
