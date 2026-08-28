import type { LucideIcon } from "lucide-react";

export interface ProfileSignal {
  icon: LucideIcon;
  value: number;
  label: string;
}

interface ProfileSignalsProps {
  signals: ProfileSignal[];
}

/**
 * The candidate's profile stats as a compact editorial list - "04 Skills",
 * one row per figure - not bordered cards, not a divided box. Sits beside
 * the candidate identity on desktop (right-aligned) and stacks underneath
 * it on mobile. The number carries the visual weight; the icon is a small,
 * muted accent next to the label.
 */
export function ProfileSignals({ signals }: ProfileSignalsProps) {
  return (
    <div className="flex flex-col gap-3 sm:items-end">
      {signals.map((signal) => (
        <div key={signal.label} className="flex items-center gap-2.5">
          <span className="font-display text-xl font-bold leading-none text-ink dark:text-accent">
            {String(signal.value).padStart(2, "0")}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-3">
            <signal.icon size={12} className="opacity-60" aria-hidden="true" />
            {signal.label}
          </span>
        </div>
      ))}
    </div>
  );
}
