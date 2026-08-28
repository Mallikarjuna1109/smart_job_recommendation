import { ArrowRight, ArrowDown, Code2 } from "lucide-react";
import type { GraphPathNode } from "../types";
import { NODE_ICON, NODE_STYLE } from "../lib/graphSchema";

interface GraphChainProps {
  nodes: GraphPathNode[];
  caption?: string;
}

/**
 * Renders one literal graph path returned by /jobs/:id/match-details as a
 * connected node chain, e.g. Candidate -[WORKED_ON]-> Project
 * -[USES_TECHNOLOGY]-> Technology -[REQUIRES_TECHNOLOGY]-> Job
 * -[OFFERED_BY]-> Company. Every node name and every relationship label on
 * the connectors comes straight from the API response (node.relationship) -
 * nothing here is inferred or guessed on the frontend. Stacks vertically on
 * narrow screens, flows horizontally from `sm` up.
 */
export function GraphChain({ nodes, caption }: GraphChainProps) {
  return (
    <div>
      {caption && <p className="text-eyebrow mb-3">{caption}</p>}
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
        {nodes.map((node, index) => {
          const Icon = NODE_ICON[node.label] ?? Code2;
          return (
            <div key={`${node.label}-${node.name}-${index}`} className="flex flex-col items-start sm:flex-row sm:items-center">
              {index > 0 && (
                <div className="flex items-center gap-1.5 py-1 pl-3.5 sm:flex-col sm:gap-0.5 sm:px-2 sm:py-0">
                  <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-edge">
                    {node.relationship ?? ""}
                  </span>
                  <ArrowRight size={13} className="hidden shrink-0 text-edge sm:block" aria-hidden="true" />
                  <ArrowDown size={13} className="shrink-0 text-edge sm:hidden" aria-hidden="true" />
                </div>
              )}
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${NODE_STYLE[node.label] ?? "bg-surface-2 text-ink border border-line"}`}>
                <Icon size={15} className="shrink-0 opacity-80" aria-hidden="true" />
                <span>{node.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
