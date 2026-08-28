import { matchLevel, MATCH_LEVEL_DOT, MATCH_LEVEL_TEXT } from "../lib/match";

interface MatchSummaryProps {
  score: number;
  connectionCount: number;
  size?: "sm" | "md";
}

export function MatchSummary({ score, connectionCount, size = "sm" }: MatchSummaryProps) {
  const level = matchLevel(score);
  const textSize = size === "md" ? "text-base" : "text-sm";

  return (
    <div className={size === "md" ? "text-right" : ""}>
      <p className={`flex items-center gap-1.5 font-display font-bold ${textSize} ${MATCH_LEVEL_TEXT[level]} dark:text-accent`}>
        <span className={`h-1.5 w-1.5 rounded-full ${MATCH_LEVEL_DOT[level]} dark:bg-accent`} aria-hidden="true" />
        {score}% match
      </p>
      <p className="mt-0.5 text-xs text-ink-3">
        {connectionCount} {connectionCount === 1 ? "connection" : "connections"}
      </p>
    </div>
  );
}
