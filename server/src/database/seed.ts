import { getDriver, closeDriver } from "./connection.js";
import { hasCognoDbConfig, env } from "../config/env.js";
import { skills, technologies, companies, projects, jobs, candidates } from "./seedData.js";

async function main() {
  if (!hasCognoDbConfig()) {
    console.error(
      "[jobgraph:seed] Missing CognoDB configuration.\n" +
        "  Set COGNODB_URI, COGNODB_USERNAME and COGNODB_PASSWORD in your .env file (see .env.example) and try again."
    );
    process.exit(1);
  }

  const driver = getDriver();
  if (!driver) {
    console.error("[jobgraph:seed] Could not initialize the CognoDB driver.");
    process.exit(1);
  }

  const session = driver.session({ database: env.cognodb.database });

  try {
    console.log("[jobgraph:seed] Verifying connectivity...");
    await driver.verifyConnectivity({ database: env.cognodb.database });

    console.log("[jobgraph:seed] Clearing existing graph data...");
    await session.executeWrite((tx) => tx.run("MATCH (n) DETACH DELETE n"));

    console.log("[jobgraph:seed] Creating uniqueness constraints...");
    const constraints = [
      "CREATE CONSTRAINT candidate_id IF NOT EXISTS FOR (n:Candidate) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (n:Skill) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT technology_id IF NOT EXISTS FOR (n:Technology) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT project_id IF NOT EXISTS FOR (n:Project) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT job_id IF NOT EXISTS FOR (n:Job) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT company_id IF NOT EXISTS FOR (n:Company) REQUIRE n.id IS UNIQUE",
    ];
    for (const stmt of constraints) {
      await session.executeWrite((tx) => tx.run(stmt));
    }

    console.log(`[jobgraph:seed] Creating ${skills.length} Skill nodes...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (s:Skill {id: row.id, name: row.name, category: row.category})`,
        { rows: skills }
      )
    );

    console.log(`[jobgraph:seed] Creating ${technologies.length} Technology nodes...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (t:Technology {id: row.id, name: row.name, category: row.category})`,
        { rows: technologies }
      )
    );

    console.log(`[jobgraph:seed] Creating ${companies.length} Company nodes...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (c:Company {id: row.id, name: row.name, industry: row.industry, location: row.location})`,
        { rows: companies }
      )
    );

    console.log(`[jobgraph:seed] Creating ${projects.length} Project nodes...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (p:Project {id: row.id, name: row.name, description: row.description, duration: row.duration, domain: row.domain})`,
        { rows: projects }
      )
    );

    console.log(`[jobgraph:seed] Creating ${jobs.length} Job nodes...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (j:Job {
           id: row.id, title: row.title, description: row.description, location: row.location,
           experienceRequired: row.experienceRequired, employmentType: row.employmentType
         })`,
        { rows: jobs }
      )
    );

    console.log(`[jobgraph:seed] Creating ${candidates.length} Candidate nodes...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (c:Candidate {
           id: row.id, name: row.name, email: row.email, yearsExperience: row.yearsExperience,
           location: row.location, role: row.role
         })`,
        { rows: candidates }
      )
    );

    console.log("[jobgraph:seed] Linking Project -[:USES_TECHNOLOGY]-> Technology...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (p:Project {id: row.projectId}), (t:Technology {id: row.technologyId})
         CREATE (p)-[:USES_TECHNOLOGY]->(t)`,
        { rows: projects.flatMap((p) => p.technologyIds.map((technologyId) => ({ projectId: p.id, technologyId }))) }
      )
    );

    console.log("[jobgraph:seed] Linking Job -[:REQUIRES_SKILL]-> Skill...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (j:Job {id: row.jobId}), (s:Skill {id: row.skillId})
         CREATE (j)-[:REQUIRES_SKILL]->(s)`,
        { rows: jobs.flatMap((j) => j.skillIds.map((skillId) => ({ jobId: j.id, skillId }))) }
      )
    );

    console.log("[jobgraph:seed] Linking Job -[:REQUIRES_TECHNOLOGY]-> Technology...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (j:Job {id: row.jobId}), (t:Technology {id: row.technologyId})
         CREATE (j)-[:REQUIRES_TECHNOLOGY]->(t)`,
        { rows: jobs.flatMap((j) => j.technologyIds.map((technologyId) => ({ jobId: j.id, technologyId }))) }
      )
    );

    console.log("[jobgraph:seed] Linking Job -[:OFFERED_BY]-> Company...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (j:Job {id: row.jobId}), (c:Company {id: row.companyId})
         CREATE (j)-[:OFFERED_BY]->(c)`,
        { rows: jobs.map((j) => ({ jobId: j.id, companyId: j.companyId })) }
      )
    );

    console.log("[jobgraph:seed] Linking Candidate -[:HAS_SKILL]-> Skill...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (c:Candidate {id: row.candidateId}), (s:Skill {id: row.skillId})
         CREATE (c)-[:HAS_SKILL]->(s)`,
        { rows: candidates.flatMap((c) => c.skillIds.map((skillId) => ({ candidateId: c.id, skillId }))) }
      )
    );

    console.log("[jobgraph:seed] Linking Candidate -[:KNOWS_TECHNOLOGY]-> Technology...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (c:Candidate {id: row.candidateId}), (t:Technology {id: row.technologyId})
         CREATE (c)-[:KNOWS_TECHNOLOGY]->(t)`,
        {
          rows: candidates.flatMap((c) => c.technologyIds.map((technologyId) => ({ candidateId: c.id, technologyId }))),
        }
      )
    );

    console.log("[jobgraph:seed] Linking Candidate -[:WORKED_ON]-> Project...");
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (c:Candidate {id: row.candidateId}), (p:Project {id: row.projectId})
         CREATE (c)-[:WORKED_ON {role: row.role}]->(p)`,
        {
          rows: candidates.flatMap((c) =>
            c.projects.map(({ projectId, role }) => ({ candidateId: c.id, projectId, role }))
          ),
        }
      )
    );

    const countResult = await session.executeRead((tx) =>
      tx.run(
        `MATCH (n) RETURN count(n) AS nodeCount`
      )
    );
    const relResult = await session.executeRead((tx) =>
      tx.run(`MATCH ()-[r]->() RETURN count(r) AS relCount`)
    );

    console.log(
      `[jobgraph:seed] Done. ${countResult.records[0].get("nodeCount")} nodes and ` +
        `${relResult.records[0].get("relCount")} relationships created.`
    );
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("[jobgraph:seed] Seed failed:", err);
  process.exit(1);
});
