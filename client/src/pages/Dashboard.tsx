import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Code2, FolderKanban, Sparkles, ArrowRight } from "lucide-react";
import { api, ApiError } from "../services/api";
import { useCandidateContext } from "../context/CandidateContext";
import type { Candidate, CandidateProfile, JobRecommendation } from "../types";
import { CandidateSelector } from "../components/CandidateSelector";
import { CandidateHeader } from "../components/CandidateHeader";
import { ProfileSignals } from "../components/ProfileSignals";
import { ProfileConnections } from "../components/ProfileConnections";
import { JobListItem } from "../components/JobListItem";
import { Drawer } from "../components/Drawer";
import { JobPreview } from "../components/JobPreview";
import { LoadingState, SkeletonRows } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

export function Dashboard() {
  const { selectedCandidateId, selectCandidate } = useCandidateContext();

  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(true);

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [recommendations, setRecommendations] = useState<JobRecommendation[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  const loadCandidates = () => {
    setCandidatesLoading(true);
    setCandidatesError(null);
    api
      .getCandidates()
      .then(setCandidates)
      .catch((err: unknown) => setCandidatesError(err instanceof ApiError ? err.message : "We couldn't load candidate profiles."))
      .finally(() => setCandidatesLoading(false));
  };

  useEffect(loadCandidates, []);

  const loadDetail = () => {
    if (!selectedCandidateId) return;
    setDetailLoading(true);
    setDetailError(null);
    Promise.all([api.getCandidate(selectedCandidateId), api.getRecommendations(selectedCandidateId)])
      .then(([c, recs]) => {
        setCandidate(c);
        setRecommendations(recs);
      })
      .catch((err: unknown) => setDetailError(err instanceof ApiError ? err.message : "We couldn't load this candidate's data."))
      .finally(() => setDetailLoading(false));
  };

  useEffect(loadDetail, [selectedCandidateId]);

  // --- No candidate selected yet: the picker is the whole page ---------
  if (!selectedCandidateId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-eyebrow mb-2">JobGraph</p>
        <h1 className="text-page-title">Career graph intelligence</h1>
        <p className="text-meta mt-2 mb-8 max-w-lg">
          Select a seeded candidate to see how JobGraph traverses skills, projects and technologies to find their
          matches.
        </p>

        {candidatesLoading && <LoadingState message="Loading candidate profiles..." />}
        {!candidatesLoading && candidatesError && <ErrorState message={candidatesError} onRetry={loadCandidates} />}
        {!candidatesLoading && !candidatesError && candidates && candidates.length === 0 && (
          <EmptyState title="No candidates found" description="The database is connected, but no candidates have been seeded yet. Run the seed script to populate JobGraph." />
        )}
        {!candidatesLoading && !candidatesError && candidates && candidates.length > 0 && (
          <CandidateSelector candidates={candidates} selectedId={selectedCandidateId} onSelect={selectCandidate} />
        )}
      </div>
    );
  }

  const preview = recommendations?.find((r) => r.job.id === previewJobId) ?? null;
  const [topMatch, ...rest] = recommendations ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {detailLoading && <SkeletonRows count={3} />}
      {!detailLoading && detailError && <ErrorState message={detailError} onRetry={loadDetail} />}

      {!detailLoading && !detailError && candidate && (
        <>
          <div className="mb-14 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <CandidateHeader candidate={candidate} />
            <ProfileSignals
              signals={[
                { icon: Award, value: candidate.skills.length, label: "Skills" },
                { icon: Code2, value: candidate.technologies.length, label: "Technologies" },
                { icon: FolderKanban, value: candidate.projects.length, label: "Projects" },
                { icon: Sparkles, value: recommendations?.length ?? 0, label: "Recommended jobs" },
              ]}
            />
          </div>

          <div className="mb-14">
            <h2 className="text-section-title">Profile connections</h2>
            <p className="text-meta mt-1 mb-8 max-w-md">
              How {candidate.name.split(" ")[0]}'s experience connects to recommended opportunities.
            </p>
            <ProfileConnections
              skills={candidate.skills}
              technologies={candidate.technologies}
              projects={candidate.projects}
              recommendations={recommendations ?? []}
            />
          </div>

          {recommendations && recommendations.length === 0 && (
            <EmptyState
              title="No matches yet"
              description="This candidate's current skills and project experience aren't connected to any open role in the graph yet."
            />
          )}

          {topMatch && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-section-title">Top matches</h2>
                <Link to="/recommendations" className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-meta mb-4 max-w-xl">
                These roles are connected to {candidate.name.split(" ")[0]}'s experience through real relationships in
                CognoDB - shared skills, known technologies, or technologies picked up on past projects.
              </p>
              <div className="flex flex-col gap-3">
                {[topMatch, ...rest.slice(0, 2)].map((rec) => (
                  <JobListItem key={rec.job.id} recommendation={rec} onPreview={() => setPreviewJobId(rec.job.id)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Drawer open={!!preview} onClose={() => setPreviewJobId(null)} title={preview?.job.title}>
        {preview && <JobPreview recommendation={preview} candidateId={selectedCandidateId} />}
      </Drawer>
    </div>
  );
}
