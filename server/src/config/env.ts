import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "",

  cognodb: {
    uri: process.env.COGNODB_URI ?? "",
    username: process.env.COGNODB_USERNAME ?? "",
    password: process.env.COGNODB_PASSWORD ?? "",
    database: process.env.COGNODB_DATABASE ?? "neo4j",
  },
};

export function hasCognoDbConfig(): boolean {
  return Boolean(env.cognodb.uri && env.cognodb.username && env.cognodb.password);
}

export function getCorsOrigins(): string[] | undefined {
  const origins = env.corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : undefined;
}
