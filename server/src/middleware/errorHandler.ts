import type { NextFunction, Request, Response } from "express";
import { DatabaseUnavailableError } from "../database/connection.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DatabaseUnavailableError) {
    console.error("[jobgraph] Database unavailable:", err.message);
    res.status(503).json({
      error: "database_unavailable",
      message: "We couldn't connect to the job graph. Please try again in a moment.",
    });
    return;
  }

  console.error("[jobgraph] Unhandled error:", err);
  res.status(500).json({
    error: "internal_error",
    message: "Something went wrong. Please try again.",
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "not_found", message: "The requested resource was not found." });
}
