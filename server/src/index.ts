import express from "express";
import cors from "cors";
import { env, hasCognoDbConfig } from "./config/env.js";
import { checkDatabaseConnection, closeDriver } from "./database/connection.js";
import { candidatesRouter } from "./routes/candidates.js";
import { jobsRouter } from "./routes/jobs.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
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
