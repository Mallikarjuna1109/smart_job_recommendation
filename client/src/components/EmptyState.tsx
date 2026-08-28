import { Search, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Search, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <div className="rounded-full bg-surface-2 p-3 text-ink-3" aria-hidden="true">
        <Icon size={22} />
      </div>
      <h3 className="text-card-title">{title}</h3>
      <p className="max-w-md text-sm text-ink-2">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
