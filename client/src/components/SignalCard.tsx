import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SignalCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  children: ReactNode;
}

export function SignalCard({ icon: Icon, title, count, children }: SignalCardProps) {
  return (
    <div className="surface flex flex-col gap-4 p-5 transition hover:border-line-hover">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2 dark:bg-surface-3 dark:text-accent">
            <Icon size={15} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink">{title}</p>
        </div>
        <p className="font-display text-lg font-bold leading-none text-ink dark:text-accent">{String(count).padStart(2, "0")}</p>
      </div>
      {children}
    </div>
  );
}
