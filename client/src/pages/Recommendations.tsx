import { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useCandidateContext } from "../context/CandidateContext";
import { api, ApiError } from "../services/api";
import type { CandidateProfile, DiscoveredTechnologyMatch, JobRecommendation } from "../types";
import { JobListItem } from "../components/JobListItem";
import { FilterBar, DEFAULT_FILTERS, type RecommendationFilters } from "../components/FilterBar";
import { SkeletonRows } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { Drawer } from "../components/Drawer";
import { JobPreview } from "../components/JobPreview";

export function Recommendations() {
  const { selectedCandidateId } = useCandidateContext();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [recommendations, setRecommendations] = useState<JobRecommendation[] | null>(null);
  const [discovered, setDiscovered] = useState<DiscoveredTechnologyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecommendationFilters>(DEFAULT_FILTERS);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  const load = () => {
    if (!selectedCandidateId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getCandidate(selectedCandidateId),
      api.getRecommendations(selectedCandidateId),
      api.getDiscoveredTechnologies(selectedCandidateId),
    ])
      .then(([c, recs, discoveredTech]) => {
        setCandidate(c);
        setRecommendations(recs);
        setDiscovered(discoveredTech);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "We couldn't load recommendations. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [selectedCandidateId]);

  const locations = useMemo(() => Array.from(new Set((recommendations ?? []).map((r) => r.job.location))).sort(), [recommendations]);

  const filtered = useMemo(() => {
    if (!recommendations) return [];
    const q = filters.search.trim().toLowerCase();
    let list = recommendations.filter((r) => {
      if (q && !`${r.job.title} ${r.job.company.name}`.toLowerCase().includes(q)) return false;
      if (filters.location && r.job.location !== filters.location) return false;
      if (filters.minExperience && r.job.experienceRequired < filters.minExperience) return false;
      return true;
    });
    list = [...list].sort((a, b) => (filters.sort === "score" ? b.score - a.score : a.job.experienceRequired - b.job.experienceRequired));
    return list;
  }, [recommendations, filters]);

  const discoveredTechNames = useMemo(() => Array.from(new Set(discovered.map((d) => d.technology))), [discovered]);
  const preview = recommendations?.find((r) => r.job.id === previewJobId) ?? null;

  if (!selectedCandidateId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState title="No candidate selected" description="Select a candidate from the navigation bar to see their recommendations." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-page-title">Recommended opportunities</h1>
        <p className="text-meta mt-1.5 max-w-2xl">
          {candidate ? `Jobs connected to ${candidate.name}'s experience through the graph.` : "Loading..."}
        </p>
      </div>

      {loading && <SkeletonRows count={4} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && recommendations && recommendations.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="No matching jobs yet"
          description="We couldn't find jobs connected to this candidate's current skills and project experience."
        />
      )}

      {!loading && !error && recommendations && recommendations.length > 0 && (
        <>
          {discoveredTechNames.length > 0 && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
              <Lightbulb size={17} className="mt-0.5 shrink-0 text-accent-2 dark:text-accent" />
              <p className="text-sm text-ink-2">
                <strong className="text-ink">Graph insight:</strong> hands-on experience with{" "}
                <strong className="text-ink">{discoveredTechNames.join(", ")}</strong> shows up through past projects,
                even though {discoveredTechNames.length === 1 ? "it isn't" : "they aren't"} listed as a known
                technology. Some matches below reflect that project-derived experience.
              </p>
            </div>
          )}

          <div className="surface mb-5 p-4">
            <FilterBar filters={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} locations={locations} />
          </div>

          <p className="text-helper mb-3">
            {filtered.length} of {recommendations.length} {recommendations.length === 1 ? "role" : "roles"}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              title="No roles match these filters"
              description="Try widening your search, location, or experience filters."
              action={
                <button className="btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((rec) => (
                <JobListItem key={rec.job.id} recommendation={rec} onPreview={() => setPreviewJobId(rec.job.id)} />
              ))}
            </div>
          )}
        </>
      )}

      <Drawer open={!!preview} onClose={() => setPreviewJobId(null)} title={preview?.job.title}>
        {preview && <JobPreview recommendation={preview} candidateId={selectedCandidateId} />}
      </Drawer>
    </div>
  );
}
