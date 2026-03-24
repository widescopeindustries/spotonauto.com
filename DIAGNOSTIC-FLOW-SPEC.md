# Programmatic Diagnostic Flow Generation — Architecture Spec
*March 24, 2026 — Bubba + Lyndon*

## The Core Insight

The SpotOnAuto corpus (factory service manuals, wiring diagrams, DTC codes, repair procedures) was written by engineers for technicians. Regular people can't navigate it. AI is the translation layer that turns this technical corpus into intuitive, step-by-step paths a car owner can follow.

The knowledge graph already has the edges. What's missing is the **traversal engine** that walks those edges and generates human-readable diagnostic flows.

## What a Diagnostic Flow Is

A diagnostic flow is a **path through the knowledge graph** that starts from something the user knows and ends at a resolution.

**Entry points (what the user knows):**
- A symptom: "my car shakes when I brake"
- A DTC code: "P0420"
- A system: "my AC isn't blowing cold"
- A failed part: "my alternator is dead"

**Resolution (where the path ends):**
- A confirmed diagnosis with repair procedure link
- A parts list with affiliate links
- A "take it to a shop" recommendation (with cost estimate)

**The path between them is the product.**

## Graph Structure (Already Exists)

From the knowledge graph schema (`schema/graph-schema.json`):

```
Node Types:
- vehicle        (2010 Acura TL)
- system         (Cooling System, Electrical, Brakes)
- component      (Radiator, Alternator, Brake Caliper)
- procedure      (Brake Pad Replacement, Alternator R&R)
- dtc            (P0420, P0300, P0171)
- symptom        (Engine overheating, Vibration when braking)
- wiring_diagram (2010 Acura TL - Charging System)
- part           (Denso 234-9009 O2 Sensor)
- tool           (Torque wrench, Multimeter)
- spec           (Brake rotor thickness: 25mm min)

Edge Types:
- vehicle → system          (vehicle HAS system)
- system → component        (system CONTAINS component)
- component → procedure     (component REPAIRED_BY procedure)
- dtc → component           (dtc CAUSED_BY component)
- dtc → symptom             (dtc PRESENTS_AS symptom)
- symptom → component       (symptom INDICATES component)
- symptom → dtc             (symptom TRIGGERS dtc)
- component → wiring_diagram (component SHOWN_IN diagram)
- procedure → part          (procedure REQUIRES part)
- procedure → tool          (procedure REQUIRES tool)
- procedure → spec          (procedure REFERENCES spec)
- dtc → procedure           (dtc RESOLVED_BY procedure)
```

## Diagnostic Flow Generation

### Flow Type 1: Code → Resolution

User has: P0420 on a 2007 Toyota Camry

**Graph traversal:**
```
P0420 (dtc)
  ├── CAUSED_BY → Catalytic Converter (component)
  │     ├── REPAIRED_BY → Cat Replacement (procedure)
  │     │     ├── REQUIRES → [catalytic converter part] (part) → Amazon affiliate
  │     │     └── REQUIRES → [O2 sensor socket] (tool) → Amazon affiliate
  │     └── SHOWN_IN → 2007 Camry Exhaust System Wiring (wiring_diagram)
  ├── CAUSED_BY → Downstream O2 Sensor (component)
  │     ├── REPAIRED_BY → O2 Sensor Replacement (procedure)
  │     │     └── REQUIRES → [Denso O2 sensor] (part) → Amazon affiliate
  │     └── SHOWN_IN → 2007 Camry O2 Sensor Circuit (wiring_diagram)
  ├── CAUSED_BY → Exhaust Leak (component/condition)
  │     └── REPAIRED_BY → Exhaust Inspection + Repair (procedure)
  └── PRESENTS_AS → "Check engine light on" (symptom)
```

**Generated page content:**
1. "P0420 on Your 2007 Toyota Camry" (H1)
2. "What this means" — plain English: "Your catalytic converter isn't cleaning exhaust efficiently."
3. "Is it safe to drive?" — Yes, but get it checked within 2 weeks
4. "Most likely causes" — ranked by probability from the graph edge weights:
   - Failing catalytic converter (most common at 150K+ miles)
   - Bad downstream O2 sensor (cheap fix, check this first)
   - Exhaust leak before the cat
5. "How to diagnose" — step-by-step, generated from the graph:
   - Step 1: Check for exhaust leaks (visual inspection)
   - Step 2: Compare front vs rear O2 sensor readings ([link to wiring diagram])
   - Step 3: If rear O2 mirrors front → cat is failing
   - Step 4: If rear O2 is lazy → replace downstream O2 sensor
6. "Parts you'll need" — affiliate links for each possible repair
7. "Wiring diagrams" — direct links to the O2 sensor circuit and exhaust system diagrams
8. "Repair guides" — links to the actual procedures

### Flow Type 2: Symptom → Diagnosis

User describes: "My car overheats in traffic but is fine on the highway"

**Graph traversal (AI-assisted):**
```
AI maps natural language → "Overheating at idle" (symptom node)

"Overheating at idle" (symptom)
  ├── INDICATES → Radiator Fan (component)
  │     ├── SHOWN_IN → [vehicle] Cooling Fan Circuit (wiring_diagram)
  │     ├── REPAIRED_BY → Fan Motor Replacement (procedure)
  │     ├── REPAIRED_BY → Fan Relay Replacement (procedure)
  │     └── REPAIRED_BY → Coolant Temp Sensor Replacement (procedure)
  ├── INDICATES → Thermostat (component)
  │     └── REPAIRED_BY → Thermostat Replacement (procedure)
  ├── INDICATES → Water Pump (component)
  │     └── REPAIRED_BY → Water Pump Replacement (procedure)
  └── TRIGGERS → P0217 (Engine Coolant Over Temperature) (dtc)
```

**Generated diagnostic flow:**
1. "Your car overheats in stop-and-go but runs cool on the highway"
2. "This usually means the radiator fan isn't working. At highway speed, air flows through the radiator naturally. In traffic, the fan needs to pull air through."
3. "Check these in order (cheapest first):"
   - Fuse ($1) → location and amp rating from the graph
   - Relay ($12) → swap test procedure
   - Temp sensor ($20) → bypass test procedure with [wiring diagram link]
   - Fan motor ($80-150) → direct 12V test procedure
4. Parts links, wiring diagram links, full repair procedures

### Flow Type 3: System Browse → Repair

User selects: 2010 Acura TL → Electrical System

**Graph traversal:**
```
2010 Acura TL (vehicle)
  └── HAS → Electrical System (system)
        ├── CONTAINS → Alternator (component)
        │     ├── REPAIRED_BY → Alternator Replacement
        │     ├── SHOWN_IN → Charging System Wiring Diagram
        │     └── related DTCs: P0562, P0622
        ├── CONTAINS → Starter (component)
        │     ├── REPAIRED_BY → Starter Replacement
        │     ├── SHOWN_IN → Starting System Wiring Diagram
        │     └── related DTCs: P0615, P0616
        ├── CONTAINS → Battery (component)
        ├── CONTAINS → Fuse Box (component)
        │     └── SHOWN_IN → Power Distribution Wiring Diagram
        └── [... all other electrical components]
```

**Generated page:** A visual system explorer showing every component in the electrical system, each linking to its repair procedures, wiring diagrams, related codes, and parts.

## Implementation Plan

### Phase 1: Static Graph Slice Generation (Week 1)
- Build the traversal engine as an offline script
- For every vehicle × DTC combination in the graph, generate a JSON "flow slice"
- For every vehicle × symptom, generate a flow slice
- Store these as pre-computed JSON files in Cloudflare R2/KV
- Render them server-side as pages → instant load, zero runtime cost

### Phase 2: AI-Enhanced Flow Narration (Week 2)
- Take the raw graph traversal data and pass it through an LLM
- The LLM's job: translate the technical path into plain English steps
- "Check the downstream O2 sensor circuit (connector C205, pins 3 and 4)" becomes "Find the O2 sensor wire behind the catalytic converter — it's the 4-wire connector near the exhaust pipe, about 12 inches past the cat"
- Cache these narrations alongside the graph slices

### Phase 3: Interactive Diagnostic Chat (Week 3)
- The AI chat on /diagnose uses the graph as its tool
- User describes symptom → AI queries the graph → AI walks the user through the diagnostic path step by step
- "Did the fan spin when you applied 12V? → Yes → Then the fan motor is good, the issue is upstream. Let's check the relay..."
- Every step links to the relevant wiring diagram, spec page, or procedure

### Phase 4: Programmatic Page Generation at Scale (Week 4+)
- Generate pages for every vehicle × code × symptom combination
- Each page is a unique diagnostic flow: "P0420 on a 2007 Toyota Camry" is different from "P0420 on a 2012 Ford F-150" because the graph traversal yields different components, diagrams, and procedures
- This creates potentially millions of highly specific, genuinely useful pages that rank for ultra-long-tail queries
- Every page has affiliate links for the specific parts needed

## Revenue Model Per Flow

Each diagnostic flow page naturally contains:
1. **Parts affiliate links** — specific to the vehicle and repair (Amazon/TOPDON)
2. **Tool affiliate links** — multimeters, scan tools, specialty tools
3. **AdSense** — auto repair niche is $10-25 RPM
4. **Premium features** — save your diagnostic session, get push notifications for recall updates, etc.

## The Moat

Nobody else has:
- 148K wiring diagrams connected to repair procedures
- Factory-level diagnostic data available for free
- AI that can traverse a real knowledge graph (not just hallucinate generic advice)
- Pre-computed flows for every vehicle × problem combination

ChatGPT can give you generic "P0420 usually means bad cat" advice. SpotOnAuto gives you "P0420 on YOUR 2007 Camry → here's the exact O2 sensor wiring diagram → here's the pin numbers to check → here's the $47 sensor you need → here's the 25-minute replacement procedure."

That's the difference between a search engine and a tool.

## What This Means for the Homepage

The 3-lane entry maps directly to the graph:

1. **"I don't know what's wrong"** → AI walks the symptom → component → diagnostic edges
2. **"I know what needs fixing"** → User picks the vehicle → system → component → procedure edges
3. **"I have a code"** → Direct DTC → cause → diagnostic → repair → parts traversal

Every lane ends at the same place: a specific, actionable, revenue-generating page built from the graph.
