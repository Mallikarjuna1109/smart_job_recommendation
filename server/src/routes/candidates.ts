import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { listCandidates, getCandidateProfile } from "../database/queries/candidates.js";
import { getRecommendationsForCandidate, getDiscoveredTechnologies } from "../services/recommendationService.js";

export const candidatesRouter = Router();

// GET /api/candidates - candidate picker on the Dashboard
candidatesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const candidates = await listCandidates();
    res.json({ candidates });
  })
);

// GET /api/candidates/:id - Candidate Profile page
candidatesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await getCandidateProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: "not_found", message: "Candidate not found." });
      return;
    }
    res.json({ candidate: profile });
  })
);

// GET /api/candidates/:id/recommendations - core multi-hop recommendation query
candidatesRouter.get(
  "/:id/recommendations",
  asyncHandler(async (req, res) => {
    const recommendations = await getRecommendationsForCandidate(req.params.id);
    res.json({ recommendations });
  })
);

// GET /api/candidates/:id/discovered-technologies - graph-native query, exposed on its own for transparency
candidatesRouter.get(
  "/:id/discovered-technologies",
  asyncHandler(async (req, res) => {
    const matches = await getDiscoveredTechnologies(req.params.id);
    res.json({ matches });
  })
);
