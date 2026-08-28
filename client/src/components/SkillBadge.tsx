interface SkillBadgeProps {
  label: string;
  tone?: "default" | "accent" | "positive";
}

const TONE_CLASSES: Record<NonNullable<SkillBadgeProps["tone"]>, string> = {
  default: "badge",
  accent: "badge-accent",
  positive: "badge-positive",
};

/** Small reusable tag for a skill/technology name - the single source of tag styling app-wide. */
export function SkillBadge({ label, tone = "default" }: SkillBadgeProps) {
  return <span className={TONE_CLASSES[tone]}>{label}</span>;
}
