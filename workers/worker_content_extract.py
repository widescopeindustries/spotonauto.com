#!/usr/bin/env python3
"""Worker 3: Extract tools and specs from procedure content via LEMON proxy.

Fetches procedure pages from the local LEMON backend and extracts:
- Tools (torque wrench, multimeter, scan tool, etc.)
- Torque specs (Nm, ft-lb, in-lb)
- Step counts
"""
import os, re, time, requests
from neo4j import GraphDatabase

URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
USER = os.environ.get("NEO4J_USER", "neo4j")
PASS = os.environ.get("NEO4J_PASSWORD", "spotonauto2026")
PROXY = os.environ.get("LEMON_PROXY", "http://127.0.0.1:8080")

TOOL_PATTERNS = [
    (re.compile(r'\btorque wrench\b', re.I), "Torque Wrench"),
    (re.compile(r'\bsocket set\b|\bsocket wrench\b', re.I), "Socket Set"),
    (re.compile(r'\bscan tool\b|\bscanner\b|\bobd2\b', re.I), "Scan Tool"),
    (re.compile(r'\bmultimeter\b|\bvoltmeter\b', re.I), "Multimeter"),
    (re.compile(r'\bo2 sensor socket\b', re.I), "O2 Sensor Socket"),
    (re.compile(r'\bspark plug socket\b', re.I), "Spark Plug Socket"),
    (re.compile(r'\bspring compressor\b', re.I), "Spring Compressor"),
    (re.compile(r'\bbrake caliper tool\b', re.I), "Brake Caliper Tool"),
    (re.compile(r'\btiming light\b', re.I), "Timing Light"),
    (re.compile(r'\bcompression tester\b', re.I), "Compression Tester"),
    (re.compile(r'\bfuel pressure gauge\b', re.I), "Fuel Pressure Gauge"),
    (re.compile(r'\bcooling system pressure tester\b', re.I), "Cooling System Pressure Tester"),
    (re.compile(r'\bfloor jack\b', re.I), "Floor Jack"),
    (re.compile(r'\bjack stands?\b', re.I), "Jack Stands"),
    (re.compile(r'\bdigital caliper\b', re.I), "Digital Caliper"),
]

TORQUE_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(?:Nm|N·m|ft[-\s]?lb|in[-\s]?lb)', re.I)

def extract_tools(text):
    return list(set(t for p, t in TOOL_PATTERNS if p.search(text)))

def extract_specs(text):
    specs, seen = [], set()
    for m in TORQUE_RE.finditer(text):
        val = m.group(1)
        unit = 'ft-lb' if 'ft' in m.group(0).lower() else ('in-lb' if 'in' in m.group(0).lower() else 'Nm')
        spec = f"{val} {unit}"
        if spec not in seen:
            specs.append(spec); seen.add(spec)
    return specs

def fetch_content(path):
    """Fetch procedure content from LEMON proxy."""
    url = f"{PROXY}{path}"
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        pass
    return ""

def main():
    driver = GraphDatabase.driver(URI, auth=(USER, PASS))
    print("[content-extract] Starting...")

    with driver.session() as session:
        # Find procedures that have a URL and haven't been processed for tools/specs
        result = session.run(
            "MATCH (p:Procedure) WHERE p.url IS NOT NULL AND p.url <> '' "
            "AND NOT (p)-[:REQUIRES_TOOL]->() "
            "RETURN p.id AS id, p.url AS url LIMIT 5000"
        )

        processed = 0
        tools_created = 0
        specs_created = 0

        for record in result:
            proc_id = record["id"]
            url = record["url"]
            if not url:
                continue

            html = fetch_content(url)
            if not html:
                continue

            # Strip HTML tags for plain text extraction
            text = re.sub(r'<[^>]+>', ' ', html)
            text = re.sub(r'\s+', ' ', text)

            tools = extract_tools(text)
            specs = extract_specs(text)

            # Write to Neo4j
            for tool in tools:
                session.run(
                    "MATCH (p:Procedure {id: $id}) "
                    "MERGE (t:Tool {name: $tool}) "
                    "MERGE (p)-[:REQUIRES_TOOL]->(t)",
                    id=proc_id, tool=tool
                )
                tools_created += 1

            for spec in specs:
                session.run(
                    "MATCH (p:Procedure {id: $id}) "
                    "MERGE (s:Spec {value: $spec}) "
                    "MERGE (p)-[:HAS_SPEC]->(s)",
                    id=proc_id, spec=spec
                )
                specs_created += 1

            processed += 1
            if processed % 100 == 0:
                print(f"[content-extract] {processed} processed | tools={tools_created} specs={specs_created}")

    print(f"[content-extract] DONE. Processed={processed} Tools={tools_created} Specs={specs_created}")
    driver.close()

if __name__ == "__main__":
    main()
