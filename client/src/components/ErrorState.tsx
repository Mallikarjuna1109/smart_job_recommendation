import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Shown when the API call failed outright - most commonly because CognoDB is
 * unreachable. Deliberately generic/user-friendly; technical detail stays in
 * server logs (see server/src/middleware/errorHandler.ts).
 */
export function ErrorState({ title = "We couldn't connect to the job graph", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/25 bg-danger/5 px-6 py-16 text-center">
      <div className="rounded-full bg-danger/10 p-3 text-danger" aria-hidden="true">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-card-title">{title}</h3>
      <p className="max-w-md text-sm text-ink-2">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
