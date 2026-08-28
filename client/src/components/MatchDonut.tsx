import { matchLevel, MATCH_LEVEL_TEXT } from "../lib/match";

interface MatchDonutProps {
  score: number;
  size?: number;
}

const STROKE_WIDTH = 5;

/**
 * Circular progress ring for a match score - the percentage is drawn as the
 * filled arc AND always rendered as text in the center, so the information
 * is never conveyed by color/geometry alone. Ring and text share the same
 * match-tier color (lib/match.ts): green/amber/orange/neutral, never a flat
 * beige override, per the "use match colors for the donut and percentage"
 * rule - beige is reserved elsewhere (CTA text, headings, selected states).
 */
export function MatchDonut({ score, size = 64 }: MatchDonutProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;
  const colorClass = MATCH_LEVEL_TEXT[matchLevel(clamped)];

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${score}% match`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={STROKE_WIDTH} className="stroke-line" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          className={`${colorClass} transition-[stroke-dashoffset] duration-500 ease-out`}
        />
      </svg>
      <span
        className={`absolute font-display font-bold leading-none ${colorClass}`}
        style={{ fontSize: size >= 60 ? "15px" : "11px" }}
        aria-hidden="true"
      >
        {score}%
      </span>
    </div>
  );
}
