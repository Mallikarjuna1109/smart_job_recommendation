import type { Skill, Technology, Project } from "../types";

export interface ProfileSnapshot {
  /** Distinct project domains, straight from project.domain - real data, not inferred. */
  domains: string[];
  /** The skill/technology categories this candidate has the most entries in, most first. */
  technicalFocus: string[];
}

/**
 * Derives a factual "professional snapshot" from the candidate's own data -
 * no invented biography text. Domain focus comes directly from the real
 * `project.domain` values; technical focus is a plain frequency count over
 * the real skill/technology `category` fields.
 */
export function computeProfileSnapshot(skills: Skill[], technologies: Technology[], projects: Project[]): ProfileSnapshot {
  const domains = Array.from(new Set(projects.map((p) => p.domain).filter(Boolean)));

  const categoryCounts = new Map<string, number>();
  const bump = (category: string) => categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  skills.forEach((s) => bump(s.category));
  technologies.forEach((t) => bump(t.category));

  const technicalFocus = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category]) => category);

  return { domains, technicalFocus };
}
