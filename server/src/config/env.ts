import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the root-level .env (server/../.env) so the whole monorepo shares one file,
// then fall back to a server-local .env if present. Skipped in tests so the
// test suite is hermetic regardless of what's in a developer's local .env.
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

/**
 * Centralized, typed configuration. Nothing in this file contains a secret -
 * every value is read from process.env, which is populated from `.env`
 * (git-ignored) or from the hosting platform's environment variable settings.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),

  cognodb: {
    uri: process.env.COGNODB_URI ?? "",
    username: process.env.COGNODB_USERNAME ?? "",
    password: process.env.COGNODB_PASSWORD ?? "",
    database: process.env.COGNODB_DATABASE ?? "neo4j",
  },
};

/**
 * The app is intentionally allowed to *start* without valid DB credentials
 * (see requirement: "graceful handling when the database is unavailable").
 * This just tells us whether we should even attempt to connect, so we can
 * log a helpful message instead of throwing on boot.
 */
export function hasCognoDbConfig(): boolean {
  return Boolean(env.cognodb.uri && env.cognodb.username && env.cognodb.password);
}
