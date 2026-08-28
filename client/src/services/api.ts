import type {
  Candidate,
  CandidateProfile,
  DiscoveredTechnologyMatch,
  HealthStatus,
  JobRecommendation,
  JobWithCompany,
  MatchExplanation,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/** Thrown for any non-2xx API response. Carries the server's friendly message when available. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`);
  } catch {
    // Network-level failure - server unreachable entirely.
    throw new ApiError(0, "We couldn't reach the JobGraph server. Please check your connection and try again.");
  }

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON - fall back to the generic message
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export const api = {
  getHealth: () => request<HealthStatus>("/health"),

  getCandidates: () => request<{ candidates: Candidate[] }>("/candidates").then((r) => r.candidates),

  getCandidate: (id: string) => request<{ candidate: CandidateProfile }>(`/candidates/${id}`).then((r) => r.candidate),

  getRecommendations: (candidateId: string) =>
    request<{ recommendations: JobRecommendation[] }>(`/candidates/${candidateId}/recommendations`).then(
      (r) => r.recommendations
    ),

  getDiscoveredTechnologies: (candidateId: string) =>
    request<{ matches: DiscoveredTechnologyMatch[] }>(`/candidates/${candidateId}/discovered-technologies`).then(
      (r) => r.matches
    ),

  getJob: (id: string) => request<{ job: JobWithCompany }>(`/jobs/${id}`).then((r) => r.job),

  getMatchDetails: (jobId: string, candidateId: string) =>
    request<{ matchDetails: MatchExplanation }>(`/jobs/${jobId}/match-details?candidateId=${candidateId}`).then(
      (r) => r.matchDetails
    ),
};
