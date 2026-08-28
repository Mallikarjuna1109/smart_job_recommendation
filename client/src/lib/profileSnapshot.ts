import type { Skill, Technology, Project } from "../types";

export interface ProfileSnapshot {
  domains: string[];
  technicalFocus: string[];
}

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
