import express from "express";
import cors from "cors";
import { env, hasCognoDbConfig, getCorsOrigins } from "./config/env.js";
import { checkDatabaseConnection, closeDriver } from "./database/connection.js";
import { candidatesRouter } from "./routes/candidates.js";
import { jobsRouter } from "./routes/jobs.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// CORS_ORIGIN (comma-separated) restricts this to a known frontend origin
// once the deployment URL is known. Left unset, CORS stays open - matching
// the previous behavior - which is fine for local dev (the Vite dev server
// proxies /api same-origin) and fine for a demo deployment, but should be
// set once the production frontend URL is finalized.
const corsOrigins = getCorsOrigins();
app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined));
app.use(express.json());

app.use("/api/candidates", candidatesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/health", healthRouter);

app.use("/api", notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[jobgraph] API server listening on http://localhost:${env.port}`);

  if (!hasCognoDbConfig()) {
    console.warn(
      "[jobgraph] COGNODB_URI / COGNODB_USERNAME / COGNODB_PASSWORD are not set.\n" +
        "           The API will start, but every database-backed route will return a\n" +
        "           friendly 503 until you configure `.env` (see .env.example) and restart."
    );
    return;
  }

  checkDatabaseConnection().then((result) => {
    if (result.ok) {
      console.log("[jobgraph] Connected to CognoDB.");
    } else {
      console.warn(`[jobgraph] Could not verify CognoDB connection: ${result.message}`);
    }
  });
});

process.on("SIGINT", async () => {
  await closeDriver();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await closeDriver();
  process.exit(0);
});
