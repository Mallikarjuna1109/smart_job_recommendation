import {
  Braces,
  Database,
  Cloud,
  Layers,
  Users,
  Server,
  PanelsTopLeft,
  Cpu,
  MessageSquare,
  Zap,
  Webhook,
  BrainCircuit,
  Settings2,
  Boxes,
  Search,
  Code2,
  type LucideIcon,
} from "lucide-react";

/** Every skill/technology category value actually present in the seed data (see server/src/database/seedData.ts). */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  Language: Braces,
  Database: Database,
  Cloud: Cloud,
  "Engineering Practice": Layers,
  "Soft Skill": Users,
  "Backend Framework": Server,
  "Frontend Framework": PanelsTopLeft,
  Runtime: Cpu,
  Messaging: MessageSquare,
  Cache: Zap,
  API: Webhook,
  "Machine Learning": BrainCircuit,
  DevOps: Settings2,
  Infrastructure: Boxes,
  Search: Search,
};

/** Icon for a skill/technology category - falls back to a generic code icon for any category not in the known set. */
export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON[category] ?? Code2;
}
