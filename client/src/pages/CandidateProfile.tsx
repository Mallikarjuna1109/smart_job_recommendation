import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Briefcase, Clock, FolderKanban, ArrowRight } from "lucide-react";
import { useCandidateContext } from "../context/CandidateContext";
import { api, ApiError } from "../services/api";
import type { CandidateProfile as CandidateProfileType, Skill, Technology } from "../types";
import { SkeletonRows } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { SkillBadge } from "../components/SkillBadge";
import { SignalCard } from "../components/SignalCard";
import { getCategoryIcon } from "../lib/categoryIcon";
import { computeProfileSnapshot } from "../lib/profileSnapshot";

function groupByCategory<T extends { category: string; id: string; name: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.category || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

export function CandidateProfile() {
  const { selectedCandidateId } = useCandidateContext();
  const [candidate, setCandidate] = useState<CandidateProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!selectedCandidateId) return;
    setLoading(true);
    setError(null);
    api
      .getCandidate(selectedCandidateId)
      .then(setCandidate)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "We couldn't load this profile. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [selectedCandidateId]);

  if (!selectedCandidateId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState title="No candidate selected" description="Select a candidate from the navigation bar to view their skills, technologies and projects." />
      </div>
    );
  }

  const snapshot = candidate ? computeProfileSnapshot(candidate.skills, candidate.technologies, candidate.projects) : null;
  const skillGroups = candidate ? groupByCategory<Skill>(candidate.skills) : [];
  const techGroups = candidate ? groupByCategory<Technology>(candidate.technologies) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {loading && <SkeletonRows count={3} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && candidate && snapshot && (
        <>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-page-title">{candidate.name}</h1>
              <p className="text-meta mt-0.5">{candidate.role}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-2">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-ink-3" aria-hidden="true" /> {candidate.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-ink-3" aria-hidden="true" /> {candidate.yearsExperience} years experience
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-ink-3" aria-hidden="true" /> {candidate.email}
                </span>
              </div>
            </div>
            <Link to="/recommendations" className="btn-primary shrink-0">
              Find matches <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="surface mb-10 p-6">
            <p className="text-eyebrow mb-2">Professional snapshot</p>
            <p className="text-base leading-relaxed text-ink-2">
              {candidate.name.split(" ")[0]} is a <span className="font-medium text-ink">{candidate.role}</span> with{" "}
              {candidate.yearsExperience} years of experience.
            </p>

            {(snapshot.domains.length > 0 || snapshot.technicalFocus.length > 0) && (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {snapshot.domains.length > 0 && (
                  <div>
                    <p className="text-helper mb-2">Domain focus</p>
                    <div className="flex flex-wrap gap-1.5">
                      {snapshot.domains.map((domain) => (
                        <SkillBadge key={domain} label={domain} tone="accent" />
                      ))}
                    </div>
                  </div>
                )}
                {snapshot.technicalFocus.length > 0 && (
                  <div>
                    <p className="text-helper mb-2">Technical focus</p>
                    <div className="flex flex-wrap gap-1.5">
                      {snapshot.technicalFocus.map((category) => (
                        <SkillBadge key={category} label={category} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-section-title">Skills</h2>
            {skillGroups.length === 0 ? (
              <p className="text-meta mt-2">No skills listed yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skillGroups.map(([category, items]) => (
                  <SignalCard key={category} icon={getCategoryIcon(category)} title={category} count={items.length}>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((s) => (
                        <SkillBadge key={s.id} label={s.name} />
                      ))}
                    </div>
                  </SignalCard>
                ))}
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-section-title">Technology stack</h2>
            {techGroups.length === 0 ? (
              <p className="text-meta mt-2">No technologies listed yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {techGroups.map(([category, items]) => (
                  <SignalCard key={category} icon={getCategoryIcon(category)} title={category} count={items.length}>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((t) => (
                        <SkillBadge key={t.id} label={t.name} />
                      ))}
                    </div>
                  </SignalCard>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-section-title">Project experience</h2>
            {candidate.projects.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No projects" description="This candidate has no project history in the graph yet." />
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {candidate.projects.map((project) => (
                  <div key={project.id} className="surface p-6">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2 dark:bg-surface-3 dark:text-accent">
                        <FolderKanban size={16} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                          <h3 className="text-lg font-semibold text-ink">{project.name}</h3>
                          <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-3">
                            <Clock size={12} aria-hidden="true" /> {project.duration}
                          </span>
                        </div>
                        <div className="mt-2">
                          <SkillBadge label={project.domain} tone="accent" />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-ink-2">{project.description}</p>
                        {project.technologies.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {project.technologies.map((t) => (
                              <SkillBadge key={t.id} label={t.name} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
