import type { LucideIcon } from "lucide-react";

export interface ProfileSignal {
  icon: LucideIcon;
  value: number;
  label: string;
}

interface ProfileSignalsProps {
  signals: ProfileSignal[];
}

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
