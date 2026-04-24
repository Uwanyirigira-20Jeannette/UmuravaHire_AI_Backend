/* ─────────────────────────────────────────────────────────────────
   Job
───────────────────────────────────────────────────────────────── */
export interface Job {
  _id: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  location: string;
  experienceYears: number;
  educationRequired?: string;
  shortlistTarget: 10 | 20;
  status: 'active' | 'screening' | 'completed';
  applicantCount: number;
  createdAt: string;
  updatedAt: string;
}

/* ─────────────────────────────────────────────────────────────────
   Talent Profile — full schema per specification
───────────────────────────────────────────────────────────────── */

export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience?: number;
}

export interface Language {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;        // YYYY-MM
  endDate?: string;         // YYYY-MM | "Present"
  description?: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear?: number;
  endYear?: number;
}

export interface Certification {
  name: string;
  issuer?: string;
  issueDate?: string;       // YYYY-MM
}

export interface Project {
  name: string;
  description?: string;
  technologies: string[];
  role?: string;
  link?: string;
  startDate?: string;       // YYYY-MM
  endDate?: string;         // YYYY-MM
}

export interface Availability {
  status: 'Available' | 'Open to Opportunities' | 'Not Available';
  type?: 'Full-time' | 'Part-time' | 'Contract';
  startDate?: string;       // YYYY-MM-DD
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  website?: string;
}

export interface TalentProfile {
  _id: string;
  jobId: string;

  // 3.1 Basic information
  firstName: string;
  lastName:  string;   // empty string allowed (single-name / PDF uploads)
  name:      string;        // firstName + ' ' + lastName
  email:     string;
  phone?:    string;
  headline:  string;
  bio?:      string;
  location:  string;

  // 3.2 Skills & languages
  skills:     Skill[];
  languages?: Language[];

  // 3.3 Work experience
  experience:      WorkExperience[];
  experienceYears: number;
  currentRole?:    string;

  // 3.4 Education
  education: Education[];

  // 3.5 Certifications
  certifications?: Certification[];

  // 3.6 Projects
  projects: Project[];

  // 3.7 Availability
  availability?: Availability;

  // 3.8 Social links
  socialLinks?: SocialLinks;

  // Meta
  source:   'csv' | 'pdf' | 'umurava' | 'manual';
  summary?: string;

  createdAt: string;
}

/* ─────────────────────────────────────────────────────────────────
   Screening Result
───────────────────────────────────────────────────────────────── */

export interface ScoreBreakdown {
  skills: number;       // weight 35%
  experience: number;   // weight 30%
  education: number;    // weight 20%
  relevance: number;    // weight 15%
}

export type HiringSuggestion = 'Strong Yes' | 'Yes' | 'Maybe' | 'No';

export interface ScreeningResult {
  _id: string;
  jobId: string;
  talentId: string | TalentProfile;
  rank: number;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  hiringSuggestion: HiringSuggestion;
  createdAt: string;
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  screened: number;
  shortlisted: number;
  completedJobs: number;
}
