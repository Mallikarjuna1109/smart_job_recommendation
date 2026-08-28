import { runQuery } from "../connection.js";
import { toNumber } from "../../utils/neo4j.js";
import type { Candidate, CandidateProfile, Project, Skill, Technology } from "../../types/domain.js";

function toCandidate(props: Record<string, any>): Candidate {
  return {
    id: props.id,
    name: props.name,
    email: props.email,
    yearsExperience: toNumber(props.yearsExperience),
    location: props.location,
    role: props.role,
  };
}

/** GET /api/candidates - list all candidates for the profile picker. Simple, no traversal. */
export async function listCandidates(): Promise<Candidate[]> {
  const records = await runQuery(
    `MATCH (c:Candidate)
     RETURN c
     ORDER BY c.name ASC`
  );
  return records.map((r) => toCandidate((r.get("c") as any).properties));
}

function toSkillOrTech(n: any): Skill | Technology {
  return { id: n.properties.id, name: n.properties.name, category: n.properties.category };
}

/**
 * GET /api/candidates/:id - a candidate's full profile: direct skills,
 * direct technologies, and every project they worked on together with the
 * technologies that project used.
 *
 * This is split into two queries instead of one. CognoDB's Cypher
 * implementation doesn't support *nested* aggregation - i.e. calling an
 * aggregating function like `collect()` inside the arguments of another
 * aggregating function within the same WITH (which is what the original,
 * single-query version did to build `projectData`: a `collect(... {
 * technologies: collect(...) })`). Each query below only ever aggregates
 * once per WITH, so each stays valid, and the two result sets are merged
 * here in the application layer.
 */
export async function getCandidateProfile(candidateId: string): Promise<CandidateProfile | null> {
  const candidateRecords = await runQuery(
    `MATCH (c:Candidate {id: $candidateId})
     OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
     OPTIONAL MATCH (c)-[:KNOWS_TECHNOLOGY]->(t:Technology)
     WITH c,
          collect(DISTINCT s) AS skills,
          collect(DISTINCT t) AS technologies
     RETURN c, skills, technologies`,
    { candidateId }
  );

  if (candidateRecords.length === 0) return null;
  const record = candidateRecords[0];
  const cNode = record.get("c") as any;
  if (!cNode) return null;

  const skills: Skill[] = ((record.get("skills") as any[]) ?? [])
    .filter(Boolean)
    .map(toSkillOrTech);

  const technologies: Technology[] = ((record.get("technologies") as any[]) ?? [])
    .filter(Boolean)
    .map(toSkillOrTech);

  // Second query: one row per project the candidate worked on, each with its
  // own (single-level) collect() of the technologies that project uses.
  const projectRecords = await runQuery(
    `MATCH (c:Candidate {id: $candidateId})-[:WORKED_ON]->(p:Project)
     OPTIONAL MATCH (p)-[:USES_TECHNOLOGY]->(pt:Technology)
     WITH p, collect(DISTINCT pt) AS technologies
     RETURN p, technologies
     ORDER BY p.name ASC`,
    { candidateId }
  );

  const projects: (Project & { technologies: Technology[] })[] = projectRecords.map((r) => {
    const p = (r.get("p") as any).properties;
    const techs: Technology[] = ((r.get("technologies") as any[]) ?? [])
      .filter(Boolean)
      .map(toSkillOrTech);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      duration: p.duration,
      domain: p.domain,
      technologies: techs,
    };
  });

  return {
    ...toCandidate(cNode.properties),
    skills,
    technologies,
    projects,
  };
}
