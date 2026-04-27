import 'server-only';
import neo4j from 'neo4j-driver';
import { runQuery } from './neo4jClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphProcedure {
  id: string;
  title: string;
  url: string | null;
  system: string;
  component: string | null;
  vehicleName: string | null;
  vehicleYear: number | null;
}

export interface GraphDTCResult {
  code: string;
  description: string | null;
  component: string | null;
  totalProcedures: number;
  componentProcedures: GraphProcedure[];
}

export interface GraphDiagnoseResult {
  dtc: string;
  description: string | null;
  component: string;
  procedures: GraphProcedure[];
  tools: string[];
  specs: string[];
}

export interface GraphSearchResult {
  id: string;
  title: string;
  url: string | null;
  system: string;
  component: string;
  dtcCodes: string[];
}

export interface GraphVehicleResult {
  year: number;
  make: string;
  model: string;
  variant: string;
  procedures: GraphProcedure[];
  dtcs: Array<{ code: string; description: string | null; component: string }>;
  systems: Array<{ name: string; procedureCount: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'low' in value) {
    return (value as { low: number; high: number }).low;
  }
  return null;
}

function toString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

// ─── DTC Lookup ──────────────────────────────────────────────────────────────

export async function getDTCGraphData(code: string, limit = 8): Promise<GraphDTCResult | null> {
  const upperCode = code.toUpperCase();

  const dtcRows = await runQuery<{
    code: string;
    description: string | null;
    component: string | null;
  }>(
    `MATCH (d:DTC {code: $code})
     OPTIONAL MATCH (d)-[:TRIGGERED_BY]->(c:Component)
     RETURN d.code AS code, d.description AS description, collect(DISTINCT c.name)[0] AS component
     LIMIT 1`,
    { code: upperCode }
  );

  if (dtcRows.length === 0) return null;

  const dtc = dtcRows[0];
  const component = dtc.component;

  const procedureQuery = component
    ? `MATCH (d:DTC {code: $code})-[:TRIGGERED_BY]->(c:Component {name: $component})
       MATCH (c)-[:HAS_PROCEDURE]->(p:Procedure)
       OPTIONAL MATCH (p)-[:APPLIES_TO]->(v:Variant)
       RETURN p.id AS id, p.title AS title, p.url AS url, c.name AS system,
              v.name AS vehicleName, v.year AS vehicleYear
       ORDER BY p.title
       LIMIT $limit`
    : `MATCH (d:DTC {code: $code})-[:TRIGGERED_BY]->(p:Procedure)
       OPTIONAL MATCH (p)-[:APPLIES_TO]->(v:Variant)
       RETURN p.id AS id, p.title AS title, p.url AS url, d.code AS system,
              v.name AS vehicleName, v.year AS vehicleYear
       ORDER BY p.title
       LIMIT $limit`;

  const procRows = await runQuery<{
    id: string;
    title: string;
    url: string | null;
    system: string;
    vehicleName: string | null;
    vehicleYear: unknown;
  }>(procedureQuery, { code: upperCode, component, limit: neo4j.int(limit) });

  const countRows = await runQuery<{ total: unknown }>(
    component
      ? `MATCH (:DTC {code: $code})-[:TRIGGERED_BY]->(c:Component {name: $component})-[:HAS_PROCEDURE]->(p:Procedure) RETURN count(p) AS total`
      : `MATCH (:DTC {code: $code})-[:TRIGGERED_BY]->(p:Procedure) RETURN count(p) AS total`,
    { code: upperCode, component }
  );

  return {
    code: dtc.code,
    description: dtc.description,
    component: component,
    componentProcedures: procRows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      system: r.system,
      vehicleName: r.vehicleName,
      vehicleYear: toInt(r.vehicleYear),
      component: component,
    })),
    totalProcedures: toInt(countRows[0]?.total) || 0,
  };
}

// ─── Diagnose with Vehicle ───────────────────────────────────────────────────

export async function diagnoseWithGraph(
  dtc: string,
  year?: number,
  make?: string,
  model?: string,
  limit = 6
): Promise<GraphDiagnoseResult | null> {
  const upperDtc = dtc.toUpperCase();

  const query = year && make && model
    ? `MATCH (d:DTC {code: $dtc})-[:TRIGGERED_BY]->(c:Component)
       MATCH (c)-[:HAS_PROCEDURE]->(p:Procedure)-[:APPLIES_TO]->(v:Variant)
       WHERE v.year = $year AND v.make = $make AND v.model = $model
       OPTIONAL MATCH (p)-[:REQUIRES_TOOL]->(t:Tool)
       OPTIONAL MATCH (p)-[:HAS_SPEC]->(s:Spec)
       RETURN d.code AS dtc, d.description AS description, c.name AS component,
              collect(DISTINCT {id: p.id, title: p.title, url: p.url, system: c.name})[0..$limit] AS procedures,
              collect(DISTINCT t.name) AS tools,
              collect(DISTINCT s.value) AS specs
       LIMIT 1`
    : `MATCH (d:DTC {code: $dtc})-[:TRIGGERED_BY]->(c:Component)
       MATCH (c)-[:HAS_PROCEDURE]->(p:Procedure)
       OPTIONAL MATCH (p)-[:REQUIRES_TOOL]->(t:Tool)
       OPTIONAL MATCH (p)-[:HAS_SPEC]->(s:Spec)
       RETURN d.code AS dtc, d.description AS description, c.name AS component,
              collect(DISTINCT {id: p.id, title: p.title, url: p.url, system: c.name})[0..$limit] AS procedures,
              collect(DISTINCT t.name) AS tools,
              collect(DISTINCT s.value) AS specs
       LIMIT 1`;

  const params: Record<string, unknown> = { dtc: upperDtc, limit: neo4j.int(limit) };
  if (year) params.year = neo4j.int(year);
  if (make) params.make = make;
  if (model) params.model = model;

  const rows = await runQuery<{
    dtc: string;
    description: string | null;
    component: string;
    procedures: Array<{
      id: string;
      title: string;
      url: string | null;
      system: string;
    }>;
    tools: string[];
    specs: string[];
  }>(query, params);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    dtc: row.dtc,
    description: row.description,
    component: row.component,
    procedures: (row.procedures || []).map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      system: p.system,
      vehicleName: null,
      vehicleYear: null,
      component: row.component,
    })),
    tools: row.tools || [],
    specs: row.specs || [],
  };
}

// ─── Search Procedures ───────────────────────────────────────────────────────

export async function searchGraphProcedures(
  q: string,
  limit = 10
): Promise<GraphSearchResult[]> {
  const pattern = `(?i).*${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`;

  const rows = await runQuery<{
    id: string;
    title: string;
    url: string | null;
    system: string;
    component: string;
    dtcCodes: string[];
  }>(
    `MATCH (p:Procedure)
     WHERE p.title =~ $pattern
     OPTIONAL MATCH (p)<-[:HAS_PROCEDURE]-(c:Component)
     OPTIONAL MATCH (c)<-[:CONTAINS_COMPONENT]-(s:System)
     OPTIONAL MATCH (c)<-[:TRIGGERED_BY]-(d:DTC)
     RETURN p.id AS id, p.title AS title, p.url AS url,
            COALESCE(s.name, c.name, 'General') AS system,
            c.name AS component,
            collect(DISTINCT d.code)[0..5] AS dtcCodes
     ORDER BY p.title
     LIMIT $limit`,
    { pattern, limit: neo4j.int(limit) }
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    system: r.system,
    component: r.component,
    dtcCodes: r.dtcCodes || [],
  }));
}

// ─── Vehicle Lookup ──────────────────────────────────────────────────────────

export async function getVehicleGraphData(
  year: number,
  make: string,
  model: string,
  limit = 20
): Promise<GraphVehicleResult | null> {
  const normMake = make.trim();
  const normModel = model.trim();

  // Find or create variant
  const variantRows = await runQuery<{
    name: string;
    year: unknown;
    make: string;
    model: string;
  }>(
    `MATCH (y:Year {year: $year})<-[:HAS_YEAR]-(m:Make {name: $make})<-[:MAKES]-(v:Vehicle)-[:HAS_VARIANT]->(va:Variant)
     WHERE va.name CONTAINS $model
     RETURN va.name AS name, y.year AS year, m.name AS make, va.model AS model
     LIMIT 1`,
    { year: neo4j.int(year), make: normMake, model: normModel }
  );

  if (variantRows.length === 0) {
    // Fallback: try to match via procedure IDs which contain year/make/model
    const fallbackRows = await runQuery<{
      name: string;
      year: unknown;
      make: string;
      model: string;
    }>(
      `MATCH (p:Procedure)
       WHERE p.id STARTS WITH 'vehicle:' + $year + ':' + $make + ':' + $model
       RETURN $year + ' ' + $make + ' ' + $model AS name,
              $year AS year, $make AS make, $model AS model
       LIMIT 1`,
      { year: String(year), make: normMake, model: normModel }
    );
    if (fallbackRows.length === 0) return null;
  }

  const variant = variantRows[0] || { name: `${year} ${make} ${model}`, year, make, model };

  // Get procedures for this vehicle
  const procRows = await runQuery<{
    id: string;
    title: string;
    url: string | null;
    system: string;
    component: string | null;
  }>(
    `MATCH (p:Procedure)
     WHERE p.id STARTS WITH 'vehicle:' + $year + ':' + $make + ':' + $model
     OPTIONAL MATCH (p)<-[:HAS_PROCEDURE]-(c:Component)
     OPTIONAL MATCH (c)<-[:CONTAINS_COMPONENT]-(s:System)
     RETURN p.id AS id, p.title AS title, p.url AS url,
            COALESCE(s.name, c.name, 'General') AS system,
            c.name AS component
     ORDER BY p.title
     LIMIT $limit`,
    { year: String(year), make: normMake, model: normModel, limit: neo4j.int(limit) }
  );

  // Get DTCs that affect this vehicle
  const dtcRows = await runQuery<{
    code: string;
    description: string | null;
    component: string;
  }>(
    `MATCH (d:DTC)-[:TRIGGERED_BY]->(c:Component)-[:HAS_PROCEDURE]->(p:Procedure)
     WHERE p.id STARTS WITH 'vehicle:' + $year + ':' + $make + ':' + $model
     RETURN DISTINCT d.code AS code, d.description AS description, c.name AS component
     ORDER BY d.code
     LIMIT 20`,
    { year: String(year), make: normMake, model: normModel }
  );

  // Get systems breakdown
  const systemRows = await runQuery<{
    name: string;
    procedureCount: unknown;
  }>(
    `MATCH (p:Procedure)
     WHERE p.id STARTS WITH 'vehicle:' + $year + ':' + $make + ':' + $model
     OPTIONAL MATCH (p)<-[:HAS_PROCEDURE]-(c:Component)
     OPTIONAL MATCH (c)<-[:CONTAINS_COMPONENT]-(s:System)
     WITH COALESCE(s.name, c.name, 'General') AS name
     RETURN name, count(*) AS procedureCount
     ORDER BY procedureCount DESC
     LIMIT 10`,
    { year: String(year), make: normMake, model: normModel }
  );

  return {
    year: toInt(variant.year) || year,
    make: variant.make || make,
    model: variant.model || model,
    variant: variant.name,
    procedures: procRows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      system: r.system,
      vehicleName: variant.name,
      vehicleYear: year,
      component: r.component,
    })),
    dtcs: dtcRows.map((r) => ({
      code: r.code,
      description: r.description,
      component: r.component,
    })),
    systems: systemRows.map((r) => ({
      name: r.name,
      procedureCount: toInt(r.procedureCount) || 0,
    })),
  };
}
