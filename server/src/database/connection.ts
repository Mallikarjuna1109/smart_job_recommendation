import neo4j, { Driver, Session, ManagedTransaction } from "neo4j-driver";
import { env, hasCognoDbConfig } from "../config/env.js";

let driver: Driver | null = null;
let driverInitError: string | null = null;

function createDriver(): Driver {
  return neo4j.driver(
    env.cognodb.uri,
    neo4j.auth.basic(env.cognodb.username, env.cognodb.password),
    {
      maxConnectionPoolSize: 20,
      connectionAcquisitionTimeout: 10_000,
    }
  );
}

export function getDriver(): Driver | null {
  if (driver) return driver;
  if (!hasCognoDbConfig()) {
    driverInitError = "CognoDB credentials are not configured (COGNODB_URI / COGNODB_USERNAME / COGNODB_PASSWORD).";
    return null;
  }
  try {
    driver = createDriver();
    driverInitError = null;
    return driver;
  } catch (err) {
    driverInitError = err instanceof Error ? err.message : "Unknown driver initialization error";
    console.error("[jobgraph] Failed to initialize CognoDB driver:", driverInitError);
    return null;
  }
}

export async function checkDatabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const d = getDriver();
  if (!d) {
    return { ok: false, message: driverInitError ?? "Database driver is not configured." };
  }
  try {
    await d.verifyConnectivity({ database: env.cognodb.database });
    return { ok: true, message: "Connected to CognoDB." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown connectivity error";
    console.error("[jobgraph] CognoDB connectivity check failed:", message);
    return { ok: false, message };
  }
}

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : undefined;
    super(causeMessage ?? "The graph database is currently unavailable.");
    this.name = "DatabaseUnavailableError";
  }
}

function getSession(): Session {
  const d = getDriver();
  if (!d) throw new DatabaseUnavailableError(driverInitError ?? undefined);
  return d.session({ database: env.cognodb.database });
}

export async function runQuery(cypher: string, params: Record<string, unknown> = {}) {
  const session = getSession();
  try {
    const result = await session.executeRead((tx: ManagedTransaction) => tx.run(cypher, params));
    return result.records;
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) throw err;
    console.error("[jobgraph] Query failed:", (err as Error)?.message, "\nCypher:", cypher);
    throw new DatabaseUnavailableError(err);
  } finally {
    await session.close();
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
