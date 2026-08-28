import { Award, Code2, GitBranch, Briefcase, MapPin, type LucideIcon } from "lucide-react";
import type { MatchReason } from "../types";

const ICONS: Record<MatchReason["type"], LucideIcon> = {
  skill: Award,
  technology: Code2,
  project_technology: GitBranch,
  experience: Briefcase,
  location: MapPin,
};

export function MatchReasonList({ reasons }: { reasons: MatchReason[] }) {
  if (reasons.length === 0) {
    return <p className="text-sm text-ink-2">No specific graph connections contributed to this score.</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {reasons.map((reason) => {
        const Icon = ICONS[reason.type];
        return (
          <li key={reason.label} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2.5 text-ink-2">
              <Icon size={15} className="shrink-0 text-ink-3" aria-hidden="true" />
              {reason.label}
            </span>
            <span className="shrink-0 font-display text-sm font-semibold text-ink dark:text-accent">+{reason.points}</span>
          </li>
        );
      })}
    </ul>
  );
}
