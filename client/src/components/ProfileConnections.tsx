import { Link } from "react-router-dom";
import { Award, Code2, FolderKanban, BriefcaseBusiness, Link2, ChevronRight } from "lucide-react";
import type { Skill, Technology, Project, JobRecommendation } from "../types";
import { computeStrongestConnections } from "../lib/connections";
import { getRoleIcon } from "../lib/roleIcon";
import { SignalMetric } from "./SignalMetric";
import { SignalCard } from "./SignalCard";
import { SkillBadge } from "./SkillBadge";

interface ProfileConnectionsProps {
  skills: Skill[];
  technologies: Technology[];
  projects: Project[];
  recommendations: JobRecommendation[];
}

export function ProfileConnections({ skills, technologies, projects, recommendations }: ProfileConnectionsProps) {
  const strongest = computeStrongestConnections(recommendations);
  const topRoles = recommendations.slice(0, 3);
  const maxCount = strongest[0]?.count ?? 0;

  const cards = [
    skills.length > 0 && (
      <SignalCard key="skills" icon={Award} title="Skills" count={skills.length}>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <SkillBadge key={s.id} label={s.name} />
          ))}
        </div>
      </SignalCard>
    ),
    technologies.length > 0 && (
      <SignalCard key="technologies" icon={Code2} title="Technologies" count={technologies.length}>
        <div className="flex flex-wrap gap-1.5">
          {technologies.map((t) => (
            <SkillBadge key={t.id} label={t.name} />
          ))}
        </div>
      </SignalCard>
    ),
    projects.length > 0 && (
      <SignalCard key="project" icon={FolderKanban} title={projects.length === 1 ? "Project" : "Projects"} count={projects.length}>
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <div key={project.id}>
              <p className="text-sm font-medium text-ink">{project.name}</p>
              {project.technologies.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <SkillBadge key={t.id} label={t.name} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SignalCard>
    ),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-10">
      <div className="surface grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <SignalMetric icon={Award} value={String(skills.length).padStart(2, "0")} label="Skills" helper="Core capabilities" />
        <SignalMetric icon={Code2} value={String(technologies.length).padStart(2, "0")} label="Technologies" helper="Known technologies" />
        <SignalMetric
          icon={BriefcaseBusiness}
          value={recommendations.length}
          label="Recommended jobs"
          helper="Connected opportunities"
        />
      </div>

      {cards.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink">Your strongest signals</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
        </div>
      )}

      {(strongest.length > 0 || topRoles.length > 0) && (
        <div>
          <p className="text-sm font-semibold text-ink">Matching insights</p>
          <p className="text-meta mt-1">Why these signals lead to your recommended opportunities.</p>

          <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {strongest.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Strongest connections</p>
                <div className="mt-3 flex flex-col divide-y divide-line/60">
                  {strongest.map((conn, i) => {
                    const isTop = i === 0;
                    const pct = maxCount > 0 ? Math.round((conn.count / maxCount) * 100) : 0;
                    return (
                      <div key={conn.name} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                            <Link2
                              size={13}
                              className={`shrink-0 ${isTop ? "text-match-excellent" : "text-match-strong"}`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{conn.name}</span>
                          </span>
                          <span className="shrink-0 text-xs text-ink-3">{isTop ? "Strong connection" : "Notable connection"}</span>
                        </div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2 dark:bg-surface-3">
                          <div
                            className={`h-full rounded-full ${isTop ? "bg-match-excellent" : "bg-match-strong"}`}
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {topRoles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Top connected roles</p>
                <div className="mt-3 flex flex-col divide-y divide-line/60">
                  {topRoles.map((rec) => {
                    const RoleIcon = getRoleIcon(rec.job.title);
                    return (
                      <Link
                        key={rec.job.id}
                        to={`/jobs/${rec.job.id}`}
                        className="group flex items-center gap-3 py-3 text-left transition first:pt-0 last:pb-0"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2 dark:bg-surface-3 dark:text-accent">
                          <RoleIcon size={14} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink transition group-hover:text-accent-2 dark:group-hover:text-accent">
                            {rec.job.title}
                          </p>
                          <p className="truncate text-xs text-ink-3">{rec.job.company.name}</p>
                        </div>
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink dark:group-hover:text-accent"
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
