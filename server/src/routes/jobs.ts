import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getJobById, listJobs } from "../database/queries/jobs.js";
import { getMatchExplanation } from "../services/recommendationService.js";

export const jobsRouter = Router();

// GET /api/jobs - used sparingly (e.g. Graph Explorer); recommendations are the primary job feed
jobsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const jobs = await listJobs();
    res.json({ jobs });
  })
);

// GET /api/jobs/:id - Job Details page
jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await getJobById(req.params.id);
    if (!job) {
      res.status(404).json({ error: "not_found", message: "Job not found." });
      return;
    }
    res.json({ job });
  })
);

// GET /api/jobs/:id/match-details?candidateId=... - "Why this match?" explanation
jobsRouter.get(
  "/:id/match-details",
  asyncHandler(async (req, res) => {
    const candidateId = req.query.candidateId as string | undefined;
    if (!candidateId) {
      res.status(400).json({ error: "bad_request", message: "candidateId query parameter is required." });
      return;
    }
    const explanation = await getMatchExplanation(candidateId, req.params.id);
    if (!explanation) {
      res.status(404).json({ error: "not_found", message: "Candidate or job not found." });
      return;
    }
    res.json({ matchDetails: explanation });
  })
);
