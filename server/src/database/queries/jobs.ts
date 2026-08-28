import { runQuery } from "../connection.js";
import { toNumber } from "../../utils/neo4j.js";
import type { JobWithCompany, Skill, Technology } from "../../types/domain.js";

function mapJobRecord(record: any): JobWithCompany {
  const j = record.get("j").properties;
  const company = record.get("company").properties;
  const requiredSkills: Skill[] = ((record.get("skills") as any[]) ?? [])
    .filter(Boolean)
    .map((n: any) => ({ id: n.properties.id, name: n.properties.name, category: n.properties.category }));
  const requiredTechnologies: Technology[] = ((record.get("technologies") as any[]) ?? [])
    .filter(Boolean)
    .map((n: any) => ({ id: n.properties.id, name: n.properties.name, category: n.properties.category }));

  return {
    id: j.id,
    title: j.title,
    description: j.description,
    location: j.location,
    experienceRequired: toNumber(j.experienceRequired),
    employmentType: j.employmentType,
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      location: company.location,
    },
    requiredSkills,
    requiredTechnologies,
  };
}

export async function getJobById(jobId: string): Promise<JobWithCompany | null> {
  const records = await runQuery(
    `MATCH (j:Job {id: $jobId})-[:OFFERED_BY]->(company:Company)
     OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
     OPTIONAL MATCH (j)-[:REQUIRES_TECHNOLOGY]->(t:Technology)
     WITH j, company, collect(DISTINCT s) AS skills, collect(DISTINCT t) AS technologies
     RETURN j, company, skills, technologies`,
    { jobId }
  );
  if (records.length === 0) return null;
  return mapJobRecord(records[0]);
}

export async function listJobs(): Promise<JobWithCompany[]> {
  const records = await runQuery(
    `MATCH (j:Job)-[:OFFERED_BY]->(company:Company)
     OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
     OPTIONAL MATCH (j)-[:REQUIRES_TECHNOLOGY]->(t:Technology)
     WITH j, company, collect(DISTINCT s) AS skills, collect(DISTINCT t) AS technologies
     RETURN j, company, skills, technologies
     ORDER BY j.title ASC`
  );
  return records.map(mapJobRecord);
}
