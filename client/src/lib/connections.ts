import type { JobRecommendation } from "../types";

export interface SignalConnection {
  name: string;
  /** How many of the candidate's real recommendations this signal showed up in. */
  count: number;
}

/**
 * The skill/technology names most frequently reflected across this
 * candidate's actual recommendations, with their real frequency count - a
 * plain tally over the `matchedSkills`/`directTechnologies` arrays the API
 * already returns on every JobRecommendation. Not an invented score or a
 * fabricated graph edge: just "which of this candidate's signals shows up
 * most often in the roles the backend already matched them to," and how
 * often. The count is what the UI uses for the strength bar - never a
 * made-up percentage.
 */
export function computeStrongestConnections(recommendations: JobRecommendation[], limit = 3): SignalConnection[] {
  const counts = new Map<string, number>();
  const bump = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1);
  for (const rec of recommendations) {
    rec.matchedSkills.forEach(bump);
    rec.directTechnologies.forEach(bump);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}
