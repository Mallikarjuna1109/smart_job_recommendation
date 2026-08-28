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

const POINTS_PER_SKILL = 15;
const POINTS_PER_DIRECT_TECHNOLOGY = 15;
const POINTS_PER_PROJECT_ONLY_TECHNOLOGY = 12;
const POINTS_EXPERIENCE_MET = 10;
const POINTS_EXPERIENCE_CLOSE = 5;
const POINTS_LOCATION_MATCH = 5;
const MAX_SCORE = 100;

function isRemote(location: string): boolean {
  return location?.toLowerCase().includes("remote");
}

export function scoreJobMatch(raw: RawJobMatch): JobRecommendation {
  const reasons: MatchReason[] = [];

  for (const skill of raw.matchedSkills) {
    reasons.push({ type: "skill", label: skill, points: POINTS_PER_SKILL });
  }

  for (const tech of raw.directTechnologies) {
    reasons.push({ type: "technology", label: tech, points: POINTS_PER_DIRECT_TECHNOLOGY });
  }

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

export async function getRecommendationsForCandidate(candidateId: string): Promise<JobRecommendation[]> {
  const rawMatches = await findJobMatchesForCandidate(candidateId);
  return rawMatches.map(scoreJobMatch).sort((a, b) => b.score - a.score || a.job.id.localeCompare(b.job.id));
}

export async function getDiscoveredTechnologies(candidateId: string) {
  return findDiscoveredTechnologyMatches(candidateId);
}

export async function getMatchExplanation(candidateId: string, jobId: string): Promise<MatchExplanation | null> {
  const [candidate, job] = await Promise.all([getCandidateProfile(candidateId), getJobById(jobId)]);
  if (!candidate || !job) return null;

  const rawMatch = await findJobMatchForCandidateAndJob(candidateId, jobId);
  const scored = rawMatch
    ? scoreJobMatch(rawMatch)
    : { score: 0, reasons: [] as MatchReason[] };

  const paths = await getMatchExplanationPaths(candidateId, jobId);

  const explanationPaths: MatchExplanation["paths"] = [];

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
