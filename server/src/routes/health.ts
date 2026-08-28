import { Router } from "express";
import { checkDatabaseConnection } from "../database/connection.js";

export const healthRouter = Router();

// GET /api/health - used by the client to show a graceful "database unavailable" banner
healthRouter.get("/", async (_req, res) => {
  const db = await checkDatabaseConnection();
  res.status(db.ok ? 200 : 503).json({
    status: db.ok ? "ok" : "degraded",
    database: db.ok ? "connected" : "unavailable",
    message: db.ok ? undefined : db.message,
  });
});
