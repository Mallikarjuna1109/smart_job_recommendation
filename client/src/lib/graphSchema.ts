import { User, Award, Code2, GitBranch, Briefcase, Building2, type LucideIcon } from "lucide-react";

export const NODE_ICON: Record<string, LucideIcon> = {
  Candidate: User,
  Skill: Award,
  Technology: Code2,
  Project: GitBranch,
  Job: Briefcase,
  Company: Building2,
};

export const NODE_STYLE: Record<string, string> = {
  Candidate: "bg-ink text-canvas",
  Skill: "bg-surface-2 text-ink-2 border border-line dark:border-accent/[0.14] dark:bg-accent/[0.07]",
  Technology: "bg-surface-2 text-ink border border-line dark:border-warning/20 dark:bg-warning/10 dark:text-warning",
  Project: "bg-surface-2 text-ink border border-line dark:border-accent/[0.16] dark:bg-accent/[0.07] dark:text-accent-2",
  Job: "bg-accent/10 text-accent-2 dark:text-accent border border-accent/20",
  Company: "bg-surface-2 text-ink-2 border border-line",
};
