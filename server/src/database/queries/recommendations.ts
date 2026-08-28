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

/** Shared row->RawJobMatch mapping for both the all-jobs and single-job variants below, so they can never drift apart. */
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

/**
 * *** CORE MULTI-HOP RECOMMENDATION QUERY ***
 *
 * This is the query that makes "Find my matches" work. It fans out from a
 * single Candidate node across THREE independent graph paths and combines
 * the results per job:
 *
 *   1. (c)-[:HAS_SKILL]->(Skill)<-[:REQUIRES_SKILL]-(j)                        -- 2 hops
 *   2. (c)-[:KNOWS_TECHNOLOGY]->(Technology)<-[:REQUIRES_TECHNOLOGY]-(j)       -- 2 hops
 *   3. (c)-[:WORKED_ON]->(Project)-[:USES_TECHNOLOGY]->(Technology)
 *        <-[:REQUIRES_TECHNOLOGY]-(j)                                          -- 3 hops
 *
 * Path 3 is the interesting one: it surfaces jobs the candidate is qualified
 * for because of what they actually *built*, not just what they listed as a
 * skill. Only jobs connected through at least one of these paths are
 * returned - everything else is filtered out in the WHERE clause below, so
 * the database (not application code) decides candidacy.
 */
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

/**
 * Same traversal and scoring inputs as `findJobMatchesForCandidate`, scoped
 * to one job via `Job {id: $jobId}` instead of scanning every job - used by
 * `getMatchExplanation()` ("Why this match?") so it doesn't have to re-run
 * the multi-hop query across the whole job catalog just to read back one
 * job's result. Same MATCH/OPTIONAL MATCH/WHERE pattern as the all-jobs
 * query, so the filtering semantics (and therefore the score) for that job
 * are identical - returns null under the exact same condition the all-jobs
 * query would have excluded it (no matched skill/technology at all).
 */
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

/**
 * *** GRAPH-NATIVE QUERY (awkward in a relational schema) ***
 *
 * "Which jobs is this candidate connected to through technology they picked
 * up on a project, but never explicitly listed as a known skill/technology?"
 *
 *   (c:Candidate)-[:WORKED_ON]->(p:Project)-[:USES_TECHNOLOGY]->(t:Technology)
 *   WHERE NOT (c)-[:KNOWS_TECHNOLOGY]->(t)
 *   (t)<-[:REQUIRES_TECHNOLOGY]-(j:Job)
 *
 * In SQL this needs: a candidate_projects join table, a project_technologies
 * join table, a candidate_technologies join table used only to *exclude*
 * rows (NOT IN / LEFT JOIN ... IS NULL), and a job_technologies join table -
 * four joins plus an anti-join, re-derived every time the "shape" of the
 * question changes. Here it is one anti-pattern match. See README ->
 * "Why a Graph Database?" for the full comparison.
 */
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

/**
 * *** MATCH EXPLANATION QUERY ("Why this job?") ***
 *
 * Re-derives, for one specific candidate/job pair, every graph path that
 * connects them, so the UI can render the literal chain of nodes (Candidate
 * -> Project -> Technology -> Job -> Company) that produced the recommendation.
 */
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
