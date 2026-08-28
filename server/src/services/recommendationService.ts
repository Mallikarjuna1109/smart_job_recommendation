import {
  findJobMatchesForCandidate,
  findJobMatchForCandidateAndJob,
  findDiscoveredTechnologyMatches,
  getMatchExplanationPaths,
  type RawJobMatch,
} from "../database/queries/recommendations.js";
import { getCandidateProfile } from "../database/queries/candidates.js";
import { getJobById } from "../database/queries/jobs.js";
import type { JobRecommendation, JobWithCompany, MatchExplanation, MatchReason } from "../types/domain.js";

// --- Scoring weights -------------------------------------------------------
// Kept as named constants (not magic numbers) so the algorithm is easy to
// explain and tune. Every point awarded maps to one visible checklist item
// in the UI - there is no hidden/black-box component.
const POINTS_PER_SKILL = 15;
const POINTS_PER_DIRECT_TECHNOLOGY = 15;
const POINTS_PER_PROJECT_ONLY_TECHNOLOGY = 12;
const POINTS_EXPERIENCE_MET = 10;
const POINTS_EXPERIENCE_CLOSE = 5; // within 1 year of the requirement
const POINTS_LOCATION_MATCH = 5;
const MAX_SCORE = 100;

function isRemote(location: string): boolean {
  return location?.toLowerCase().includes("remote");
}

/**
 * Turns one raw graph-matched job into a scored recommendation with a
 * transparent, itemized breakdown ("reasons"). This is plain TypeScript -
 * no ML, no hidden weighting - deliberately, per the assignment's guidance
 * to keep the algorithm simple and explainable.
 */
export function scoreJobMatch(raw: RawJobMatch): JobRecommendation {
  const reasons: MatchReason[] = [];

  for (const skill of raw.matchedSkills) {
    reasons.push({ type: "skill", label: skill, points: POINTS_PER_SKILL });
  }

  for (const tech of raw.directTechnologies) {
    reasons.push({ type: "technology", label: tech, points: POINTS_PER_DIRECT_TECHNOLOGY });
  }

  // Technologies discovered only through project work (not already counted
  // as a directly-known technology) get their own, slightly lower-weighted
  // reason - this is the graph-native signal described in the README.
  const directTechSet = new Set(raw.directTechnologies);
  const projectOnlyTechs = raw.projectTechnologies.filter((t) => !directTechSet.has(t));
  for (const tech of projectOnlyTechs) {
    reasons.push({
      type: "project_technology",
      label: `${tech} (via project experience)`,
      points: POINTS_PER_PROJECT_ONLY_TECHNOLOGY,
    });
  }

  const experienceGap = raw.candidate.yearsExperience - raw.job.experienceRequired;
  if (experienceGap >= 0) {
    reasons.push({
      type: "experience",
      label: `${raw.candidate.yearsExperience} years experience (requires ${raw.job.experienceRequired}+)`,
      points: POINTS_EXPERIENCE_MET,
    });
  } else if (experienceGap >= -1) {
    reasons.push({
      type: "experience",
      label: `${raw.candidate.yearsExperience} years experience (close to the ${raw.job.experienceRequired}+ requirement)`,
      points: POINTS_EXPERIENCE_CLOSE,
    });
  }

  if (raw.candidate.location === raw.job.location || isRemote(raw.job.location)) {
    reasons.push({
      type: "location",
      label: isRemote(raw.job.location) ? "Remote role" : `Located in ${raw.job.location}`,
      points: POINTS_LOCATION_MATCH,
    });
  }

  const rawScore = reasons.reduce((sum, r) => sum + r.points, 0);
  const score = Math.min(MAX_SCORE, rawScore);

  const job: JobWithCompany = {
    ...raw.job,
    company: raw.company,
    requiredSkills: raw.requiredSkills.map((name) => ({ id: name, name, category: "" })),
    requiredTechnologies: raw.requiredTechnologies.map((name) => ({ id: name, name, category: "" })),
  };

  return {
    job,
    score,
    matchedSkills: raw.matchedSkills,
    directTechnologies: raw.directTechnologies,
    projectTechnologies: projectOnlyTechs,
    reasons: reasons.sort((a, b) => b.points - a.points),
  };
}

/**
 * GET /api/candidates/:id/recommendations orchestration:
 * 1. run the multi-hop graph query
 * 2. score every returned job
 * 3. sort by score, descending
 */
export async function getRecommendationsForCandidate(candidateId: string): Promise<JobRecommendation[]> {
  const rawMatches = await findJobMatchesForCandidate(candidateId);
  // Primary: score descending. Secondary: job id ascending, purely so that
  // equal-score jobs always render in the same order - never changes the
  // ranking between jobs with different scores.
  return rawMatches.map(scoreJobMatch).sort((a, b) => b.score - a.score || a.job.id.localeCompare(b.job.id));
}

/** Re-exposes the graph-native "discovered technology" query for its own endpoint. */
export async function getDiscoveredTechnologies(candidateId: string) {
  return findDiscoveredTechnologyMatches(candidateId);
}

/**
 * GET /api/jobs/:id/match-details?candidateId=... - builds the "Why this
 * match?" explanation: a transparent score breakdown plus the literal graph
 * paths (chains of nodes) that connect the candidate to the job.
 */
export async function getMatchExplanation(candidateId: string, jobId: string): Promise<MatchExplanation | null> {
  const [candidate, job] = await Promise.all([getCandidateProfile(candidateId), getJobById(jobId)]);
  if (!candidate || !job) return null;

  const rawMatch = await findJobMatchForCandidateAndJob(candidateId, jobId);
  const scored = rawMatch
    ? scoreJobMatch(rawMatch)
    : { score: 0, reasons: [] as MatchReason[] };

  const paths = await getMatchExplanationPaths(candidateId, jobId);

  const explanationPaths: MatchExplanation["paths"] = [];

  // The `relationship` on each node below is the exact Cypher relationship
  // type traversed to reach it - transcribed directly from the MATCH
  // patterns in getMatchExplanationPaths()/findJobMatchesForCandidate()
  // (recommendations.ts) and getJobById() (jobs.ts, for the OFFERED_BY
  // tail), not inferred from node-type pairs.
  for (const skillName of paths.skillNames) {
    explanationPaths.push({
      kind: "skill",
      nodes: [
        { label: "Candidate", name: candidate.name },
        { label: "Skill", name: skillName, relationship: "HAS_SKILL" },
        { label: "Job", name: job.title, relationship: "REQUIRES_SKILL" },
        { label: "Company", name: job.company.name, relationship: "OFFERED_BY" },
      ],
    });
  }

  for (const techName of paths.directTechNames) {
    explanationPaths.push({
      kind: "direct_technology",
      nodes: [
        { label: "Candidate", name: candidate.name },
        { label: "Technology", name: techName, relationship: "KNOWS_TECHNOLOGY" },
        { label: "Job", name: job.title, relationship: "REQUIRES_TECHNOLOGY" },
        { label: "Company", name: job.company.name, relationship: "OFFERED_BY" },
      ],
    });
  }

  for (const { project, technology } of paths.projectPaths) {
    explanationPaths.push({
      kind: "project_technology",
      nodes: [
        { label: "Candidate", name: candidate.name },
        { label: "Project", name: project, relationship: "WORKED_ON" },
        { label: "Technology", name: technology, relationship: "USES_TECHNOLOGY" },
        { label: "Job", name: job.title, relationship: "REQUIRES_TECHNOLOGY" },
        { label: "Company", name: job.company.name, relationship: "OFFERED_BY" },
      ],
    });
  }

  return {
    candidate: { id: candidate.id, name: candidate.name },
    job,
    score: scored.score,
    reasons: scored.reasons,
    paths: explanationPaths,
  };
}
