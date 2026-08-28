import { Search, SlidersHorizontal } from "lucide-react";

export interface RecommendationFilters {
  search: string;
  location: string;
  minExperience: number;
  sort: "score" | "experience";
}

export const DEFAULT_FILTERS: RecommendationFilters = {
  search: "",
  location: "",
  minExperience: 0,
  sort: "score",
};

interface FilterBarProps {
  filters: RecommendationFilters;
  onChange: (patch: Partial<RecommendationFilters>) => void;
  locations: string[];
}

/** Compact, single-row filter bar over the already-fetched recommendation list - no new endpoint. */
export function FilterBar({ filters, onChange, locations }: FilterBarProps) {
  const active = filters.search || filters.location || filters.minExperience > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search title or company"
          className="input pl-9"
          aria-label="Search jobs"
        />
      </div>

      <select
        value={filters.location}
        onChange={(e) => onChange({ location: e.target.value })}
        className="input w-auto"
        aria-label="Filter by location"
      >
        <option value="">All locations</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      <select
        value={filters.minExperience}
        onChange={(e) => onChange({ minExperience: Number(e.target.value) })}
        className="input w-auto"
        aria-label="Filter by experience required"
      >
        <option value={0}>Any experience</option>
        <option value={3}>3+ years</option>
        <option value={5}>5+ years</option>
        <option value={7}>7+ years</option>
      </select>

      <select
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as RecommendationFilters["sort"] })}
        className="input w-auto"
        aria-label="Sort"
      >
        <option value="score">Best match</option>
        <option value="experience">Experience required</option>
      </select>

      {active && (
        <button className="btn-ghost" onClick={() => onChange(DEFAULT_FILTERS)}>
          <SlidersHorizontal size={14} /> Clear
        </button>
      )}
    </div>
  );
}
