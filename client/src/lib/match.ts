export type MatchLevel = "excellent" | "strong" | "moderate" | "weak";

/**
 * Single source of truth for match-score thresholds and their colors -
 * shared by MatchDonut, JobListItem, and JobDetails' connection-strength
 * label. Every color below reads from the dedicated `--color-match-*`
 * tokens (index.css), never a raw hex or a generic semantic token, so the
 * four tiers stay clearly distinct from one another (and from the beige
 * accent) wherever they're used - no component hardcodes its own match
 * colors.
 */
export function matchLevel(score: number): MatchLevel {
  if (score >= 95) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 60) return "moderate";
  return "weak";
}

export const MATCH_LEVEL_LABEL: Record<MatchLevel, string> = {
  excellent: "Excellent match",
  strong: "Strong match",
  moderate: "Moderate match",
  weak: "Weak match",
};

export const MATCH_LEVEL_DOT: Record<MatchLevel, string> = {
  excellent: "bg-match-excellent",
  strong: "bg-match-strong",
  moderate: "bg-match-moderate",
  weak: "bg-match-weak",
};

export const MATCH_LEVEL_TEXT: Record<MatchLevel, string> = {
  excellent: "text-match-excellent",
  strong: "text-match-strong",
  moderate: "text-match-moderate",
  weak: "text-match-weak",
};
