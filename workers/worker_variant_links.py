#!/usr/bin/env python3
"""Worker 1: Parse procedure IDs to create Variant -> Procedure links.

Procedure IDs look like: vehicle:YYYY:make:model:proc:title
We parse these to extract year/make/model, create Variant nodes,
and link them to procedures via APPLIES_TO relationships.
"""
import os, re, time
from neo4j import GraphDatabase

URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
USER = os.environ.get("NEO4J_USER", "neo4j")
PASS = os.environ.get("NEO4J_PASSWORD", "spotonauto2026")

PROC_RE = re.compile(r"^vehicle:(\d{4}):([^:]+):([^:]+):proc:(.+)$")
BATCH_SIZE = 5000

def main():
    driver = GraphDatabase.driver(URI, auth=(USER, PASS))
    print("[variant-links] Starting...")

    with driver.session() as session:
        # Count total procedures with parseable IDs
        total = session.run(
            "MATCH (p:Procedure) WHERE p.id STARTS WITH 'vehicle:' RETURN count(p) AS c"
        ).single()["c"]
        print(f"[variant-links] Total parseable procedures: {total}")

        # Get distinct vehicle signatures from procedure IDs
        result = session.run(
            "MATCH (p:Procedure) WHERE p.id STARTS WITH 'vehicle:' "
            "RETURN DISTINCT p.id AS id"
        )

        processed = 0
        created_variants = 0
        created_links = 0
        batch = []

        for record in result:
            m = PROC_RE.match(record["id"])
            if not m:
                continue
            year, make, model, _ = m.groups()
            batch.append({
                "id": record["id"],
                "year": int(year),
                "make": make.replace("-", " ").title(),
                "model": model.replace("-", " ").title(),
                "variant_name": f"{year} {make.replace('-', ' ').title()} {model.replace('-', ' ').title()}"
            })

            if len(batch) >= BATCH_SIZE:
                r = session.run(
                    "UNWIND $batch AS row "
                    "MERGE (v:Variant {name: row.variant_name}) "
                    "ON CREATE SET v.year = row.year, v.make = row.make, v.model = row.model "
                    "WITH v, row "
                    "MATCH (p:Procedure {id: row.id}) "
                    "MERGE (p)-[:APPLIES_TO]->(v) "
                    "RETURN count(v) AS variants, count(p) AS links",
                    batch=batch
                ).single()
                created_variants += r["variants"]
                created_links += r["links"]
                processed += len(batch)
                print(f"[variant-links] {processed}/{total} | variants={created_variants} links={created_links}")
                batch = []

        # Final batch
        if batch:
            r = session.run(
                "UNWIND $batch AS row "
                "MERGE (v:Variant {name: row.variant_name}) "
                "ON CREATE SET v.year = row.year, v.make = row.make, v.model = row.model "
                "WITH v, row "
                "MATCH (p:Procedure {id: row.id}) "
                "MERGE (p)-[:APPLIES_TO]->(v) "
                "RETURN count(v) AS variants, count(p) AS links",
                batch=batch
            ).single()
            created_variants += r["variants"]
            created_links += r["links"]
            processed += len(batch)

    print(f"[variant-links] DONE. Processed={processed} Variants={created_variants} Links={created_links}")
    driver.close()

if __name__ == "__main__":
    main()
