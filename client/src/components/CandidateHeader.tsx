import { MapPin, Briefcase } from "lucide-react";
import type { CandidateProfile } from "../types";

interface CandidateHeaderProps {
  candidate: CandidateProfile;
}

/**
 * Candidate identity block for the Dashboard - a premium profile header
 * (name, role, location, experience), not a dashboard-widget label stack.
 * The name carries the visual weight; everything else is quieter support.
 */
export function CandidateHeader({ candidate }: CandidateHeaderProps) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-3 dark:text-accent/70">Selected candidate</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{candidate.name}</h1>
      <p className="mt-1.5 text-base font-medium text-ink-2 dark:text-accent-2">{candidate.role}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
        <span className="flex items-center gap-1.5">
          <MapPin size={13} aria-hidden="true" /> {candidate.location}
        </span>
        <span aria-hidden="true">&middot;</span>
        <span className="flex items-center gap-1.5">
          <Briefcase size={13} aria-hidden="true" /> {candidate.yearsExperience} years experience
        </span>
      </div>
    </div>
  );
}
