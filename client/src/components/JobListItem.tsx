import { MapPin, Briefcase, ArrowUpRight } from "lucide-react";
import type { JobRecommendation } from "../types";
import { MatchDonut } from "./MatchDonut";
import { SkillBadge } from "./SkillBadge";
import { getRoleIcon } from "../lib/roleIcon";

interface JobListItemProps {
  recommendation: JobRecommendation;
  onPreview: () => void;
}

export function JobListItem({ recommendation, onPreview }: JobListItemProps) {
  const { job, score, reasons } = recommendation;
  const topSignals = reasons.slice(0, 4);
  const strongest = reasons[0];
  const RoleIcon = getRoleIcon(job.title);

  return (
    <button
      onClick={onPreview}
      className="surface group grid w-full grid-cols-1 gap-4 px-5 py-4 text-left transition hover:border-line-hover hover:bg-surface-2 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:py-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2 dark:bg-surface-3 dark:text-accent">
          <RoleIcon size={16} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink sm:text-lg">{job.title}</h3>
          <p className="mt-0.5 truncate text-sm text-ink-2">{job.company.name}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
            <span className="flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" /> {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={12} aria-hidden="true" /> {job.experienceRequired}+ yrs
            </span>
          </div>

          {topSignals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topSignals.map((r) => (
                <SkillBadge key={r.label} label={r.label.replace(" (via project experience)", "")} tone="accent" />
              ))}
            </div>
          )}

          {strongest && (
            <p className="mt-2.5 text-xs text-ink-3">
              Strong connection: <span className="font-medium text-ink dark:text-accent-2">{strongest.label}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4 sm:flex-col sm:items-center sm:justify-center sm:gap-2 sm:border-t-0 sm:pt-0">
        <MatchDonut score={score} size={64} />
        <div className="flex flex-col items-end gap-1.5 sm:items-center">
          <p className="text-xs text-ink-3">
            {reasons.length} {reasons.length === 1 ? "connection" : "connections"}
          </p>
          <span className="flex items-center gap-1 text-xs font-semibold text-ink-2 transition group-hover:text-ink dark:text-accent dark:group-hover:text-accent-2">
            Why this match <ArrowUpRight size={13} aria-hidden="true" />
          </span>
        </div>
      </div>
    </button>
  );
}
