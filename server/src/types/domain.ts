// Domain types shared across queries, services and routes.
// These mirror the node/relationship properties defined in the graph model
// (see README.md -> "Graph Data Model").

export interface Candidate {
  id: string;
  name: string;
  email: string;
  yearsExperience: number;
  location: string;
  role: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Technology {
  id: string;
  name: string;
  category: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  duration: string;
  domain: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  experienceRequired: number;
  employmentType: string;
}

export interface CandidateProfile extends Candidate {
  skills: Skill[];
  technologies: Technology[];
  projects: (Project & { technologies: Technology[] })[];
}

export interface JobWithCompany extends Job {
  company: Company;
  requiredSkills: Skill[];
  requiredTechnologies: Technology[];
}

/** One scored reason contributing to a match score, shown in the UI as a checklist item. */
export interface MatchReason {
  type: "skill" | "technology" | "project_technology" | "experience" | "location";
  label: string;
  points: number;
}

export interface JobRecommendation {
  job: JobWithCompany;
  score: number;
  matchedSkills: string[];
  directTechnologies: string[];
  projectTechnologies: string[];
  reasons: MatchReason[];
}

/** One hop in a "why this match" explanation path, e.g. Candidate -> Project -> Technology -> Job -> Company. */
export interface GraphPathNode {
  label: string; // node label, e.g. "Project"
  name: string; // display name
  /**
   * The relationship type traversed FROM the previous node TO this node
   * (undefined for the first node in the chain, which has no predecessor).
   * This is the literal Cypher relationship type that produced this hop -
   * see the MATCH patterns in getMatchExplanation() - never inferred from
   * node-type pairs on the frontend.
   */
  relationship?: string;
}

export interface MatchExplanation {
  candidate: Pick<Candidate, "id" | "name">;
  job: JobWithCompany;
  score: number;
  reasons: MatchReason[];
  paths: {
    kind: "skill" | "direct_technology" | "project_technology";
    nodes: GraphPathNode[];
  }[];
}
