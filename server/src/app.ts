import express from "express";
import cors from "cors";
import { getCorsOrigins } from "./config/env.js";
import { candidatesRouter } from "./routes/candidates.js";
import { jobsRouter } from "./routes/jobs.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const corsOrigins = getCorsOrigins();
app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined));
app.use(express.json());

app.use("/api/candidates", candidatesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/health", healthRouter);

app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
