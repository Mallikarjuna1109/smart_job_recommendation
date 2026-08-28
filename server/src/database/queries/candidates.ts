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
