import { Cloud, ShieldCheck, Settings2, Database, BrainCircuit, Server, PanelsTopLeft, Activity, BriefcaseBusiness, type LucideIcon } from "lucide-react";

const RULES: [RegExp, LucideIcon][] = [
  [/site reliability|\bsre\b/i, Activity],
  [/security/i, ShieldCheck],
  [/devops/i, Settings2],
  [/machine learning|\bml\b|\bai\b/i, BrainCircuit],
  [/data (engineer|scientist)|analytics/i, Database],
  [/cloud|infrastructure|platform/i, Cloud],
  [/frontend|front-end/i, PanelsTopLeft],
  [/backend|back-end|java developer/i, Server],
];

/**
 * Best-effort role icon from the job title's text. The API doesn't return a
 * job category, so this is a purely cosmetic classification for the card's
 * icon container - never presented as data, and it falls back to a generic
 * briefcase icon whenever nothing matches.
 */
export function getRoleIcon(title: string): LucideIcon {
  for (const [pattern, icon] of RULES) {
    if (pattern.test(title)) return icon;
  }
  return BriefcaseBusiness;
}
