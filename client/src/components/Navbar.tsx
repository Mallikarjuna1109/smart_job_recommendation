import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Network, ChevronDown, UserRound, LayoutDashboard, Sparkles } from "lucide-react";
import { useCandidateContext } from "../context/CandidateContext";
import { ThemeToggle } from "./ThemeToggle";
import { Drawer } from "./Drawer";
import { CandidateSelector } from "./CandidateSelector";
import { api } from "../services/api";
import type { Candidate } from "../types";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: UserRound },
];

/** Top navigation: wordmark, primary nav, current-candidate switcher, theme toggle. Collapses to icon-only nav below `md` so nothing overflows on mobile. */
export function Navbar() {
  const location = useLocation();
  const { selectedCandidateId, selectCandidate } = useCandidateContext();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    api.getCandidates().then(setCandidates).catch(() => {});
  }, []);

  const current = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight text-ink">
            <Network size={20} className="text-accent" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden md:inline">JobGraph</span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const isRecommendationsOrProfile = to !== "/";
              const disabled = isRecommendationsOrProfile && !selectedCandidateId;
              const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={disabled ? "/" : to}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition sm:px-3 ${
                    isActive
                      ? "border-transparent bg-surface-2 text-ink dark:border-accent/20 dark:bg-accent/10 dark:text-accent-2"
                      : disabled
                      ? "border-transparent cursor-not-allowed text-ink-3/60"
                      : "border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink"
                  }`}
                  aria-disabled={disabled}
                  aria-label={label}
                  title={disabled ? "Select a candidate first" : label}
                >
                  <Icon size={16} className={isActive ? "text-ink dark:text-accent" : "text-ink-3"} aria-hidden="true" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 py-1.5 pl-2 pr-1.5 text-left transition hover:bg-line/40 sm:gap-2 sm:pl-2.5 sm:pr-2"
              aria-label="Switch candidate"
            >
              <UserRound size={15} className="shrink-0 text-ink-3" />
              <span className="hidden min-w-0 max-w-[110px] flex-1 sm:block">
                <span className="block truncate text-xs font-semibold text-ink">{current ? current.name : "Select"}</span>
              </span>
              <ChevronDown size={13} className="hidden shrink-0 text-ink-3 sm:block" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Drawer open={switcherOpen} onClose={() => setSwitcherOpen(false)} title="Switch candidate">
        <CandidateSelector
          candidates={candidates}
          selectedId={selectedCandidateId}
          onSelect={(id) => {
            selectCandidate(id);
            setSwitcherOpen(false);
          }}
          compact
        />
      </Drawer>
    </>
  );
}
