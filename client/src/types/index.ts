
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
  technologies: Technology[];
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
  projects: Project[];
}

export interface JobWithCompany extends Job {
  company: Company;
  requiredSkills: Skill[];
  requiredTechnologies: Technology[];
}

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

export interface GraphPathNode {
  label: string;
  name: string;
  relationship?: string;
}

export interface MatchExplanation {
  candidate: { id: string; name: string };
  job: JobWithCompany;
  score: number;
  reasons: MatchReason[];
  paths: {
    kind: "skill" | "direct_technology" | "project_technology";
    nodes: GraphPathNode[];
  }[];
}

export interface DiscoveredTechnologyMatch {
  jobId: string;
  jobTitle: string;
  companyName: string;
  technology: string;
  projectName: string;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  database: "connected" | "unavailable";
  message?: string;
}
