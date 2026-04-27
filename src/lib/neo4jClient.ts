import 'server-only';
import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'spotonauto2026';

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 16,
        connectionAcquisitionTimeout: 30000,
      }
    );
  }
  return driver;
}

export async function runQuery<T extends Record<string, unknown>>(
  query: string,
  params?: Record<string, unknown>,
  options?: { database?: string; timeout?: number }
): Promise<T[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  let session: Session | null = null;
  try {
    session = getDriver().session({
      database: options?.database || 'neo4j',
      defaultAccessMode: neo4j.session.READ,
    });

    const result: QueryResult = await session.run(query, params || {});
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key) => {
        const k = String(key);
        obj[k] = record.get(k);
      });
      return obj as T;
    });
  } catch (error) {
    console.warn('[neo4jClient] Query failed:', error);
    return [];
  } finally {
    if (session) await session.close();
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    const d = getDriver();
    await d.verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}

export function closeDriver(): void {
  if (driver) {
    driver.close();
    driver = null;
  }
}
