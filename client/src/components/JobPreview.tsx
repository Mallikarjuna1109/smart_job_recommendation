import { Link } from "react-router-dom";
import { MapPin, Briefcase, Building2, ArrowRight } from "lucide-react";
import type { JobRecommendation } from "../types";
import { MatchDonut } from "./MatchDonut";
import { SkillBadge } from "./SkillBadge";

interface JobPreviewProps {
  recommendation: JobRecommendation;
  candidateId: string;
}

/** Quick-preview content shown inside the Drawer when a job is clicked from a list. Links out to the full match-details page. */
export function JobPreview({ recommendation, candidateId }: JobPreviewProps) {
  const { job, score, reasons } = recommendation;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-meta">{job.company.name}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={13} /> {job.experienceRequired}+ yrs
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={13} /> {job.company.industry}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MatchDonut score={score} size={56} />
          <p className="text-[11px] text-ink-3">
            {reasons.length} {reasons.length === 1 ? "connection" : "connections"}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-ink-2">{job.description}</p>

      <div>
        <p className="text-eyebrow mb-2">Strong connections</p>
        <div className="flex flex-wrap gap-1.5">
          {reasons.length === 0 ? (
            <p className="text-sm text-ink-3">No specific graph connections for this role.</p>
          ) : (
            reasons.map((r) => <SkillBadge key={r.label} label={r.label} tone="accent" />)
          )}
        </div>
      </div>

      <Link to={`/jobs/${job.id}?candidateId=${candidateId}`} className="btn-primary mt-1 w-full">
        Why this match <ArrowRight size={15} />
      </Link>
    </div>
  );
}
