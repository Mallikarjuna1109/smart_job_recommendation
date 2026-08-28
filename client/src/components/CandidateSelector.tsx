import { useMemo, useState } from "react";
import { Search, MapPin, Briefcase, ChevronRight } from "lucide-react";
import type { Candidate } from "../types";

interface CandidateSelectorProps {
  candidates: Candidate[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  /** Compact mode is used inside the Navbar switcher drawer; the default is the full Dashboard picker. */
  compact?: boolean;
}

/** Searchable candidate list - replaces the old repetitive card grid. */
export function CandidateSelector({ candidates, selectedId, onSelect, compact = false }: CandidateSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => `${c.name} ${c.role} ${c.location}`.toLowerCase().includes(q));
  }, [candidates, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search candidates..."
          className="input pl-9"
          aria-label="Search candidates"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">No candidates match "{query}".</p>
      ) : (
        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
          {filtered.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                aria-pressed={active}
                className={`flex items-center justify-between gap-3 border-l-2 px-4 text-left transition ${compact ? "py-3" : "py-3.5"} ${
                  active ? "border-transparent bg-accent/5 dark:border-accent dark:bg-accent/10" : "border-transparent hover:bg-surface-2"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                  <p className="truncate text-xs text-ink-2">{c.role}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-3">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {c.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={11} /> {c.yearsExperience} yrs
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className={`shrink-0 ${active ? "text-accent" : "text-ink-3"}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
