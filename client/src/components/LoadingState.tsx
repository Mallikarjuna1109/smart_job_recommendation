import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Loader2 size={26} className="animate-spin text-ink-3" role="status" aria-label="Loading" />
      <p className="max-w-sm text-sm font-medium text-ink-2">{message}</p>
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface animate-pulse p-5">
          <div className="mb-3 h-4 w-1/3 rounded bg-surface-2" />
          <div className="mb-2 h-3 w-1/2 rounded bg-surface-2" />
          <div className="h-3 w-2/3 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
