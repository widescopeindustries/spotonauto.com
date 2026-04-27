#!/usr/bin/env python3
"""Worker 2: Link orphan DTCs to Components using code pattern matching."""
import os
from neo4j import GraphDatabase

URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
USER = os.environ.get("NEO4J_USER", "neo4j")
PASS = os.environ.get("NEO4J_PASSWORD", "spotonauto2026")

CODE_PATTERNS = {
    "Oxygen Sensor": ["P0030", "P0031", "P0032", "P0033", "P0034", "P0035", "P0036", "P0037", "P0038", "P0039",
                      "P0130", "P0131", "P0132", "P0133", "P0134", "P0135", "P0136", "P0137", "P0138", "P0139",
                      "P0140", "P0141", "P0142", "P0143", "P0144", "P0145", "P0146", "P0147", "P0148", "P0149",
                      "P0150", "P0151", "P0152", "P0153", "P0154", "P0155", "P0156", "P0157", "P0158", "P0159",
                      "P0160", "P0161", "P0162", "P0163", "P0164", "P0165", "P0166", "P0167", "P0168", "P0169",
                      "P0170", "P0171", "P0172", "P0173", "P0174", "P0175", "P2195", "P2196", "P2270", "P2271"],
    "Mass Airflow Sensor": ["P0100", "P0101", "P0102", "P0103", "P0104", "P1101"],
    "Throttle Position Sensor": ["P0120", "P0121", "P0122", "P0123", "P0124", "P0220", "P0221", "P0222", "P0223", "P2135"],
    "Spark Plug": ["P0300", "P0301", "P0302", "P0303", "P0304", "P0305", "P0306", "P0307", "P0308", "P0309", "P0310"],
    "Ignition Coil": ["P0350", "P0351", "P0352", "P0353", "P0354", "P0355", "P0356", "P0357", "P0358", "P0359"],
    "Fuel Injector": ["P0200", "P0201", "P0202", "P0203", "P0204", "P0205", "P0206", "P0207", "P0208"],
    "Fuel Pump": ["P0230", "P0231", "P0232", "P0233"],
    "Catalytic Converter": ["P0420", "P0421", "P0422", "P0423", "P0424", "P0425", "P0426", "P0427", "P0428", "P0429",
                             "P0430", "P0431", "P0432", "P0433", "P0434", "P0435", "P0436", "P0437", "P0438", "P0439",
                             "P2096", "P2097", "P2098", "P2099"],
    "EVAP Purge Valve": ["P0440", "P0441", "P0442", "P0443", "P0444", "P0445", "P0446", "P0447", "P0448", "P0449",
                          "P0496", "P0497", "P0498", "P0499"],
    "ABS Sensor": ["C0035", "C0040", "C0045", "C0050", "C0055"],
    "Alternator": ["P0560", "P0561", "P0562", "P0563"],
    "Starter Motor": ["P0615", "P0616"],
    "Battery": ["P0562", "P0563"],
    "Thermostat": ["P0125", "P0128", "P0217"],
    "Water Pump": ["P0217", "P261A"],
    "Radiator": ["P0217"],
    "Coolant Temperature Sensor": ["P0115", "P0116", "P0117", "P0118"],
    "Crankshaft Position Sensor": ["P0335", "P0336", "P0337", "P0338", "P0339", "P0016", "P0017"],
    "Camshaft Position Sensor": ["P0340", "P0341", "P0342", "P0343", "P0344", "P0016", "P0017"],
    "Knock Sensor": ["P0325", "P0326", "P0327", "P0328", "P0329"],
    "Engine Control Module": ["P0600", "P0601", "P0602", "P0603", "P0604", "P0605", "P0606"],
    "Transmission": ["P0700", "P0701", "P0702", "P0703", "P0704", "P0705", "P0706"],
    "Transmission Solenoid": ["P0750", "P0751", "P0752", "P0753", "P0754", "P0755", "P0756", "P0757", "P0758", "P0759",
                               "P0760", "P0761", "P0762", "P0763", "P0764", "P0765", "P0766", "P0767", "P0768", "P0769"],
    "Torque Converter": ["P0740", "P0741", "P0742", "P0743", "P0744"],
    "Timing Belt": ["P0016", "P0017", "P0018", "P0019"],
    "VVT Solenoid": ["P0010", "P0011", "P0012", "P0013", "P0014", "P0015", "P0020", "P0021", "P0022", "P0023", "P0024"],
    "EGR Valve": ["P0400", "P0401", "P0402", "P0403", "P0404", "P0405", "P0406", "P0407", "P0408", "P0409"],
    "PCV Valve": ["P0171", "P0174", "P0175"],
    "Air Conditioning Compressor": ["P0530", "P0531", "P0532", "P0533", "P0645"],
    "Oil Pressure Sensor": ["P0520", "P0521", "P0522", "P0523"],
    "Manifold Absolute Pressure Sensor": ["P0106", "P0107", "P0108", "P0109"],
    "Intake Air Temperature Sensor": ["P0110", "P0111", "P0112", "P0113"],
    "Charcoal Canister": ["P0440", "P0441", "P0442", "P0443", "P0444", "P0445", "P0446", "P0447", "P0448", "P0449"],
    "Fuel Pressure Sensor": ["P0087", "P0088", "P0190", "P0191", "P0192", "P0193"],
    "Turbocharger": ["P0234", "P0235", "P0236", "P0237", "P0238", "P0299"],
    "Boost Pressure Sensor": ["P0235", "P0236", "P0237", "P0238"],
    "DPF": ["P2002", "P2003", "P242F", "P2452", "P2453"],
    "NOx Sensor": ["P2200", "P2201", "P2202", "P229F"],
    "Throttle Body": ["P0121", "P0122", "P0123", "P2101", "P2111", "P2112", "P2135"],
}

def main():
    driver = GraphDatabase.driver(URI, auth=(USER, PASS))
    print("[dtc-links] Starting...")

    with driver.session() as session:
        # Count orphans
        orphan_count = session.run(
            "MATCH (d:DTC) WHERE NOT (d)-[:TRIGGERED_BY]->() RETURN count(d) AS c"
        ).single()["c"]
        print(f"[dtc-links] Orphan DTCs: {orphan_count}")

        linked = 0
        for component, codes in CODE_PATTERNS.items():
            for code in codes:
                result = session.run(
                    "MATCH (d:DTC {code: $code}) "
                    "WHERE NOT (d)-[:TRIGGERED_BY]->() "
                    "MATCH (c:Component {name: $component}) "
                    "MERGE (d)-[:TRIGGERED_BY]->(c) "
                    "RETURN count(d) AS linked",
                    code=code, component=component
                ).single()["linked"]
                linked += result

        print(f"[dtc-links] Linked {linked} orphan DTCs to components")

        # Remaining orphans
        remaining = session.run(
            "MATCH (d:DTC) WHERE NOT (d)-[:TRIGGERED_BY]->() RETURN count(d) AS c"
        ).single()["c"]
        print(f"[dtc-links] Remaining orphans: {remaining}")

    print("[dtc-links] DONE")
    driver.close()

if __name__ == "__main__":
    main()
