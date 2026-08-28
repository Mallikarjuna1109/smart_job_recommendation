import { runQuery } from "../connection.js";
import { toNumber } from "../../utils/neo4j.js";

function nodeNames(nodes: any[]): string[] {
  return (nodes ?? []).filter(Boolean).map((n: any) => n.properties?.name ?? n.name).filter(Boolean);
}

export interface RawJobMatch {
  candidate: { id: string; name: string; yearsExperience: number; location: string };
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    experienceRequired: number;
    employmentType: string;
  };
  company: { id: string; name: string; industry: string; location: string };
  requiredSkills: string[];
  requiredTechnologies: string[];
  matchedSkills: string[];
  directTechnologies: string[];
  projectTechnologies: string[];
}

function mapRawJobMatchRecord(r: any): RawJobMatch {
  const c = (r.get("c") as any).properties;
  const j = (r.get("j") as any).properties;
  const company = (r.get("company") as any).properties;
  return {
    candidate: {
      id: c.id,
      name: c.name,
      yearsExperience: toNumber(c.yearsExperience),
      location: c.location,
    },
    job: {
      id: j.id,
      title: j.title,
      description: j.description,
      location: j.location,
      experienceRequired: toNumber(j.experienceRequired),
      employmentType: j.employmentType,
    },
    company: { id: company.id, name: company.name, industry: company.industry, location: company.location },
    requiredSkills: nodeNames(r.get("requiredSkills") as any[]),
    requiredTechnologies: nodeNames(r.get("requiredTechnologies") as any[]),
    matchedSkills: nodeNames(r.get("matchedSkills") as any[]),
    directTechnologies: nodeNames(r.get("directTechnologies") as any[]),
    projectTechnologies: nodeNames(r.get("projectTechnologies") as any[]),
  };
}

export async function findJobMatchesForCandidate(candidateId: string): Promise<RawJobMatch[]> {
  const records = await runQuery(
    `MATCH (c:Candidate {id: $candidateId})
     MATCH (j:Job)-[:OFFERED_BY]->(company:Company)
     OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(reqSkill:Skill)
     OPTIONAL MATCH (j)-[:REQUIRES_TECHNOLOGY]->(reqTech:Technology)
     OPTIONAL MATCH (c)-[:HAS_SKILL]->(matchedSkill:Skill)<-[:REQUIRES_SKILL]-(j)
     OPTIONAL MATCH (c)-[:KNOWS_TECHNOLOGY]->(directTech:Technology)<-[:REQUIRES_TECHNOLOGY]-(j)
     OPTIONAL MATCH (c)-[:WORKED_ON]->(:Project)-[:USES_TECHNOLOGY]->(projectTech:Technology)<-[:REQUIRES_TECHNOLOGY]-(j)
     WITH c, j, company,
          collect(DISTINCT reqSkill) AS requiredSkills,
          collect(DISTINCT reqTech) AS requiredTechnologies,
          collect(DISTINCT matchedSkill) AS matchedSkills,
          collect(DISTINCT directTech) AS directTechnologies,
          collect(DISTINCT projectTech) AS projectTechnologies
     WHERE size(matchedSkills) > 0 OR size(directTechnologies) > 0 OR size(projectTechnologies) > 0
     RETURN c, j, company, requiredSkills, requiredTechnologies,
            matchedSkills, directTechnologies, projectTechnologies`,
    { candidateId }
  );

  return records.map(mapRawJobMatchRecord);
}

export async function findJobMatchForCandidateAndJob(candidateId: string, jobId: string): Promise<RawJobMatch | null> {
  const records = await runQuery(
    `MATCH (c:Candidate {id: $candidateId})
     MATCH (j:Job {id: $jobId})-[:OFFERED_BY]->(company:Company)
     OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(reqSkill:Skill)
     OPTIONAL MATCH (j)-[:REQUIRES_TECHNOLOGY]->(reqTech:Technology)
     OPTIONAL MATCH (c)-[:HAS_SKILL]->(matchedSkill:Skill)<-[:REQUIRES_SKILL]-(j)
     OPTIONAL MATCH (c)-[:KNOWS_TECHNOLOGY]->(directTech:Technology)<-[:REQUIRES_TECHNOLOGY]-(j)
     OPTIONAL MATCH (c)-[:WORKED_ON]->(:Project)-[:USES_TECHNOLOGY]->(projectTech:Technology)<-[:REQUIRES_TECHNOLOGY]-(j)
     WITH c, j, company,
          collect(DISTINCT reqSkill) AS requiredSkills,
          collect(DISTINCT reqTech) AS requiredTechnologies,
          collect(DISTINCT matchedSkill) AS matchedSkills,
          collect(DISTINCT directTech) AS directTechnologies,
          collect(DISTINCT projectTech) AS projectTechnologies
     WHERE size(matchedSkills) > 0 OR size(directTechnologies) > 0 OR size(projectTechnologies) > 0
     RETURN c, j, company, requiredSkills, requiredTechnologies,
            matchedSkills, directTechnologies, projectTechnologies`,
    { candidateId, jobId }
  );

  if (records.length === 0) return null;
  return mapRawJobMatchRecord(records[0]);
}

export interface DiscoveredTechnologyMatch {
  jobId: string;
  jobTitle: string;
  companyName: string;
  technology: string;
  projectName: string;
}

export async function findDiscoveredTechnologyMatches(candidateId: string): Promise<DiscoveredTechnologyMatch[]> {
  const records = await runQuery(
    `MATCH (c:Candidate {id: $candidateId})-[:WORKED_ON]->(p:Project)-[:USES_TECHNOLOGY]->(t:Technology)
     WHERE NOT (c)-[:KNOWS_TECHNOLOGY]->(t)
     MATCH (t)<-[:REQUIRES_TECHNOLOGY]-(j:Job)-[:OFFERED_BY]->(company:Company)
     RETURN DISTINCT j.id AS jobId, j.title AS jobTitle, company.name AS companyName,
            t.name AS technology, p.name AS projectName
     ORDER BY jobTitle ASC`,
    { candidateId }
  );
  return records.map((r) => ({
    jobId: r.get("jobId") as unknown as string,
    jobTitle: r.get("jobTitle") as unknown as string,
    companyName: r.get("companyName") as unknown as string,
    technology: r.get("technology") as unknown as string,
    projectName: r.get("projectName") as unknown as string,
  }));
}

export interface RawMatchExplanation {
  skillNames: string[];
  directTechNames: string[];
  projectPaths: { project: string; technology: string }[];
}

export async function getMatchExplanationPaths(candidateId: string, jobId: string): Promise<RawMatchExplanation> {
  const records = await runQuery(
    `MATCH (c:Candidate {id: $candidateId})
     MATCH (j:Job {id: $jobId})
     OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j)
     WITH c, j, collect(DISTINCT s.name) AS skillNames
     OPTIONAL MATCH (c)-[:KNOWS_TECHNOLOGY]->(t:Technology)<-[:REQUIRES_TECHNOLOGY]-(j)
     WITH c, j, skillNames, collect(DISTINCT t.name) AS directTechNames
     OPTIONAL MATCH (c)-[:WORKED_ON]->(p:Project)-[:USES_TECHNOLOGY]->(pt:Technology)<-[:REQUIRES_TECHNOLOGY]-(j)
     WITH skillNames, directTechNames,
          collect(DISTINCT CASE WHEN p IS NOT NULL THEN { project: p.name, technology: pt.name } END) AS rawProjectPaths
     RETURN skillNames, directTechNames,
            [x IN rawProjectPaths WHERE x IS NOT NULL] AS projectPaths`,
    { candidateId, jobId }
  );

  if (records.length === 0) {
    return { skillNames: [], directTechNames: [], projectPaths: [] };
  }
  const r = records[0];
  return {
    skillNames: (r.get("skillNames") as unknown as string[]) ?? [],
    directTechNames: (r.get("directTechNames") as unknown as string[]) ?? [],
    projectPaths: (r.get("projectPaths") as unknown as { project: string; technology: string }[]) ?? [],
  };
}
