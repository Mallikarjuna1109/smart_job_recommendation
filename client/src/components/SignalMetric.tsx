import type { LucideIcon } from "lucide-react";

interface SignalMetricProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  helper: string;
}

/**
 * One compact stat block (icon, number, label, supporting text) - meant to
 * sit inside a single divided container alongside its siblings, not as its
 * own bordered card. Used for the "Profile connections" summary row.
 */
export function SignalMetric({ icon: Icon, value, label, helper }: SignalMetricProps) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <Icon size={15} className="text-ink-3 dark:text-accent/70" aria-hidden="true" />
      <p className="font-display text-2xl font-bold leading-none text-ink dark:text-accent">{value}</p>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-3">{helper}</p>
      </div>
    </div>
  );
}
