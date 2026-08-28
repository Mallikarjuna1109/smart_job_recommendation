import { describe, expect, it } from "vitest";
import { scoreJobMatch } from "../services/recommendationService.js";
import type { RawJobMatch } from "../database/queries/recommendations.js";

function baseMatch(overrides: Partial<RawJobMatch> = {}): RawJobMatch {
  return {
    candidate: { id: "cand-1", name: "Test Candidate", yearsExperience: 4, location: "Austin, TX" },
    job: {
      id: "job-1",
      title: "Backend Engineer",
      description: "desc",
      location: "Austin, TX",
      experienceRequired: 3,
      employmentType: "Full-time",
    },
    company: { id: "company-1", name: "TestCo", industry: "Software", location: "Austin, TX" },
    requiredSkills: ["Java", "SQL"],
    requiredTechnologies: ["Spring Boot"],
    matchedSkills: [],
    directTechnologies: [],
    projectTechnologies: [],
    ...overrides,
  };
}

describe("scoreJobMatch", () => {
  it("awards points for each matched skill", () => {
    const result = scoreJobMatch(baseMatch({ matchedSkills: ["Java", "SQL"] }));
    const skillReasons = result.reasons.filter((r) => r.type === "skill");
    expect(skillReasons).toHaveLength(2);
    expect(result.score).toBeGreaterThanOrEqual(30);
  });

  it("awards points for directly-known technologies", () => {
    const result = scoreJobMatch(baseMatch({ directTechnologies: ["Spring Boot"] }));
    expect(result.directTechnologies).toEqual(["Spring Boot"]);
    expect(result.reasons.some((r) => r.type === "technology" && r.label === "Spring Boot")).toBe(true);
  });

  it("credits technologies discovered through project work, separately from direct technologies", () => {
    const result = scoreJobMatch(
      baseMatch({ directTechnologies: ["Spring Boot"], projectTechnologies: ["Spring Boot", "Kafka"] })
    );
    // Spring Boot is already a direct technology, so only Kafka should show as a project-only discovery.
    expect(result.projectTechnologies).toEqual(["Kafka"]);
    expect(result.reasons.some((r) => r.type === "project_technology" && r.label.includes("Kafka"))).toBe(true);
    expect(result.reasons.filter((r) => r.label.includes("Spring Boot"))).toHaveLength(1);
  });

  it("awards full experience points when the candidate meets the requirement", () => {
    const result = scoreJobMatch(baseMatch({ candidate: { id: "c", name: "n", yearsExperience: 5, location: "x" } }));
    expect(result.reasons.some((r) => r.type === "experience" && r.points === 10)).toBe(true);
  });

  it("awards partial experience points when the candidate is one year short", () => {
    const result = scoreJobMatch(baseMatch({ candidate: { id: "c", name: "n", yearsExperience: 2, location: "x" } }));
    expect(result.reasons.some((r) => r.type === "experience" && r.points === 5)).toBe(true);
  });

  it("awards no experience points when the candidate is far below the requirement", () => {
    const result = scoreJobMatch(baseMatch({ candidate: { id: "c", name: "n", yearsExperience: 0, location: "x" } }));
    expect(result.reasons.some((r) => r.type === "experience")).toBe(false);
  });

  it("awards location points for an exact location match", () => {
    const result = scoreJobMatch(baseMatch());
    expect(result.reasons.some((r) => r.type === "location")).toBe(true);
  });

  it("awards location points for a remote job regardless of candidate location", () => {
    const result = scoreJobMatch(
      baseMatch({ job: { ...baseMatch().job, location: "Remote" }, candidate: { id: "c", name: "n", yearsExperience: 4, location: "Nowhere" } })
    );
    expect(result.reasons.some((r) => r.type === "location")).toBe(true);
  });

  it("caps the total score at 100", () => {
    const result = scoreJobMatch(
      baseMatch({
        matchedSkills: ["A", "B", "C", "D", "E", "F", "G", "H"],
        directTechnologies: ["X", "Y", "Z"],
      })
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("sorts reasons from highest to lowest points", () => {
    const result = scoreJobMatch(baseMatch({ matchedSkills: ["Java"], projectTechnologies: ["Kafka"] }));
    const points = result.reasons.map((r) => r.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });
});
