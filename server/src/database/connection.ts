import neo4j, { Driver, Session, ManagedTransaction } from "neo4j-driver";
import { env, hasCognoDbConfig } from "../config/env.js";

/**
 * Single, reused driver instance for the whole process (this is the "reusable
 * connection layer" - we never create a fresh driver per-request, only
 * per-request *sessions*, which are cheap and short-lived, as recommended by
 * the Neo4j driver docs).
 */
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

/** Lazily creates (once) and returns the shared driver, or null if unconfigured. */
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

/** Verifies connectivity to CognoDB. Used by /api/health and on server boot. Never throws. */
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

/**
 * Thrown by `runQuery` whenever the database can't be reached. Route
 * handlers catch this specific error to return a clean 503 instead of
 * leaking driver internals to the client.
 */
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

/**
 * Runs a single read Cypher query with parameters and returns the raw driver
 * Records. This is the ONE place in the codebase that opens/closes a read
 * session - every query function in `database/queries/*` funnels through
 * here. Callers use `record.get(key)` to pull out fields/nodes and map them
 * into the app's own domain types (see database/queries/*.ts).
 */
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
