import type { JobRecommendation } from "../types";

export interface SignalConnection {
  name: string;
  count: number;
}

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
