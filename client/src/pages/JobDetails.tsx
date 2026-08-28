import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Building2 } from "lucide-react";
import { api, ApiError } from "../services/api";
import { useCandidateContext } from "../context/CandidateContext";
import type { MatchExplanation } from "../types";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { MatchSummary } from "../components/MatchSummary";
import { MatchReasonList } from "../components/MatchReasonList";
import { GraphChain } from "../components/GraphChain";
import { SkillBadge } from "../components/SkillBadge";
import { matchLevel, MATCH_LEVEL_LABEL, MATCH_LEVEL_TEXT, MATCH_LEVEL_DOT } from "../lib/match";

export function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const { selectedCandidateId } = useCandidateContext();
  const candidateId = searchParams.get("candidateId") ?? selectedCandidateId;

  const [details, setDetails] = useState<MatchExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!jobId || !candidateId) return;
    setLoading(true);
    setError(null);
    api
      .getMatchDetails(jobId, candidateId)
      .then(setDetails)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "We couldn't load this job's details. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [jobId, candidateId]);

  const derived = useMemo(() => {
    if (!details) return null;

    const directSkillNames = details.reasons.filter((r) => r.type === "skill").map((r) => r.label);
    const directTechNames = details.reasons.filter((r) => r.type === "technology").map((r) => r.label);

    const projectPaths = details.paths.filter((p) => p.kind === "project_technology");
    const projectConnections = new Map<string, Set<string>>();
    for (const p of projectPaths) {
      const projectNode = p.nodes.find((n) => n.label === "Project");
      const techNode = p.nodes.find((n) => n.label === "Technology");
      if (!projectNode || !techNode) continue;
      if (!projectConnections.has(projectNode.name)) projectConnections.set(projectNode.name, new Set());
      projectConnections.get(projectNode.name)!.add(techNode.name);
    }

    const representative =
      projectPaths[0] ?? details.paths.find((p) => p.kind === "direct_technology") ?? details.paths.find((p) => p.kind === "skill") ?? null;

    return { directSkillNames, directTechNames, projectConnections: Array.from(projectConnections.entries()), representative };
  }, [details]);

  if (!candidateId || !jobId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="No candidate selected"
          description="Select a candidate from the navigation bar first, then revisit a job's match details."
          action={
            <Link to="/" className="btn-primary">
              Go to Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/recommendations" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft size={15} /> Back to recommendations
      </Link>

      {loading && <LoadingState message="Tracing the graph connections behind this match..." />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && details && derived && (
        <>
          <div className="surface mb-8 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-page-title">{details.job.title}</h1>
                <p className="text-meta mt-1">{details.job.company.name}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-ink-3" /> {details.job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-ink-3" /> {details.job.experienceRequired}+ yrs required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-ink-3" /> {details.job.company.industry}
                  </span>
                </div>
              </div>
              <MatchSummary score={details.score} connectionCount={details.reasons.length} size="md" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">{details.job.description}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-section-title mb-3">Match score breakdown</h2>
            <div className="surface-2 p-4">
              <MatchReasonList reasons={details.reasons} />
            </div>
          </div>

          <div className="surface mb-8 p-6">
            <h2 className="text-section-title">Why this match</h2>
            <p className="text-meta mt-1 mb-5">A real path CognoDB traversed in the graph to connect this candidate to this role.</p>

            {derived.representative ? (
              <GraphChain nodes={derived.representative.nodes} />
            ) : (
              <p className="text-sm text-ink-3">No direct graph connection produced this recommendation.</p>
            )}

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-eyebrow mb-2">Direct skills</p>
                {derived.directSkillNames.length === 0 ? (
                  <p className="text-sm text-ink-3">None matched directly.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {derived.directSkillNames.map((s) => (
                      <SkillBadge key={s} label={s} tone="accent" />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-eyebrow mb-2">Direct technologies</p>
                {derived.directTechNames.length === 0 ? (
                  <p className="text-sm text-ink-3">None matched directly.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {derived.directTechNames.map((t) => (
                      <SkillBadge key={t} label={t} tone="accent" />
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <p className="text-eyebrow mb-2">Project connections</p>
                {derived.projectConnections.length === 0 ? (
                  <p className="text-sm text-ink-3">No project-derived connections for this role.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {derived.projectConnections.map(([project, techs]) => (
                      <p key={project} className="text-sm text-ink-2">
                        <span className="font-medium text-ink">{project}</span>
                        <span className="text-ink-3"> {"->"} </span>
                        {Array.from(techs).join(", ")}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-eyebrow mb-2">Connection strength</p>
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${MATCH_LEVEL_TEXT[matchLevel(details.score)]}`}>
                  <span className={`h-2 w-2 rounded-full ${MATCH_LEVEL_DOT[matchLevel(details.score)]}`} />
                  {MATCH_LEVEL_LABEL[matchLevel(details.score)]}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-section-title mb-3">Required for this role</h2>
            <div className="flex flex-wrap gap-1.5">
              {details.job.requiredSkills.map((s) => (
                <SkillBadge key={s.id} label={s.name} />
              ))}
              {details.job.requiredTechnologies.map((t) => (
                <SkillBadge key={t.id} label={t.name} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
