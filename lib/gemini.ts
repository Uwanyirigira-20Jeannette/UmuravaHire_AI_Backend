import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Job, TalentProfile, ScreeningResult } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CHUNK_SIZE = 20; // safe for Gemini free-tier rate limits

export interface GeminiScreeningItem {
  candidateIndex: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  hiringSuggestion: 'Strong Yes' | 'Yes' | 'Maybe' | 'No';
}

/* ─── Prompt builder ──────────────────────────────────────────────── */
function buildPrompt(job: Job, applicants: TalentProfile[]): string {
  const candidateList = applicants
    .map((a, i) => {
      const skillsStr = a.skills?.length
        ? a.skills
            .map((s) =>
              typeof s === 'string'
                ? s
                : `${s.name} (${s.level}${s.yearsOfExperience ? `, ${s.yearsOfExperience}y exp` : ''})`
            )
            .join(', ')
        : 'Not listed';

      const expStr = a.experience?.length
        ? a.experience
            .map((e) => {
              const period = `${e.startDate}–${e.isCurrent ? 'Present' : (e.endDate || 'Present')}`;
              const tech = e.technologies?.length ? ` [${e.technologies.join(', ')}]` : '';
              const desc = e.description ? `: ${e.description.slice(0, 120)}` : '';
              return `${e.role} at ${e.company} (${period})${tech}${desc}`;
            })
            .join(' | ')
        : a.currentRole
          ? `${a.currentRole} — ${a.experienceYears} year(s) total`
          : `${a.experienceYears} year(s) professional experience`;

      const eduStr = a.education?.length
        ? a.education
            .map((e) => `${e.degree} in ${e.fieldOfStudy || 'N/A'} — ${e.institution}${e.endYear ? ` (${e.endYear})` : ''}`)
            .join('; ')
        : 'Not specified';

      const certStr = a.certifications?.length
        ? a.certifications.map((c) => `${c.name}${c.issuer ? ` by ${c.issuer}` : ''}${c.issueDate ? ` (${c.issueDate})` : ''}`).join(', ')
        : null;

      const projStr = a.projects?.length
        ? a.projects
            .map((p) => `${p.name}${p.technologies?.length ? ` [${p.technologies.join(', ')}]` : ''}${p.description ? `: ${p.description.slice(0, 80)}` : ''}`)
            .join(' | ')
        : null;

      const langStr = a.languages?.length
        ? a.languages.map((l) => `${l.name} (${l.proficiency})`).join(', ')
        : null;

      const availStr = a.availability
        ? `${a.availability.status}${a.availability.type ? ` — ${a.availability.type}` : ''}${a.availability.startDate ? ` from ${a.availability.startDate}` : ''}`
        : null;

      const isPdfOnly = a.source === 'pdf' && !a.skills?.length && !a.experience?.length;

      return `
--- CANDIDATE ${i + 1} ---
Name:             ${a.name}
Headline:         ${a.headline || 'N/A'}
Current Role:     ${a.currentRole || 'N/A'}
Location:         ${a.location || 'N/A'}
Total Experience: ${a.experienceYears} year(s)
Source:           ${a.source ?? 'unknown'}${isPdfOnly ? ' [NOTE: PDF upload — evaluate bio carefully as structured fields may be sparse]' : ''}
Skills:           ${skillsStr}
Work History:     ${expStr}
Education:        ${eduStr}
${certStr ? `Certifications:   ${certStr}` : ''}
${projStr ? `Projects:         ${projStr}` : ''}
${langStr ? `Languages:        ${langStr}` : ''}
${availStr ? `Availability:     ${availStr}` : ''}
Bio/Summary:      ${a.bio || a.summary || 'Not provided'}`;
    })
    .join('\n');

  const niceToHave = (job as any).niceToHaveSkills?.length
    ? `\nNice-to-have Skills: ${((job as any).niceToHaveSkills as string[]).join(', ')}`
    : '';
  const educationReq = (job as any).educationRequired || 'Any';

  return `You are an expert AI talent screener for UmuravaHire AI — a recruitment intelligence platform built on the Umurava talent ecosystem.
Your task is to objectively evaluate each candidate against the job requirements below.
Be precise, fair, and consistent. Use specific evidence from the candidate's profile to justify each score.

=== JOB REQUIREMENTS ===
Title:               ${job.title}
Department:          ${job.department}
Required Skills:     ${job.requiredSkills.join(', ')}${niceToHave}
Minimum Experience:  ${job.experienceYears}+ years
Education Required:  ${educationReq}
Description:         ${job.description || 'Not provided'}

=== SCORING RUBRIC ===
Score each dimension from 0 to 100. Be strict — reserve 90+ for exceptional matches.

1. SKILLS MATCH (35% weight)
   - 90–100: Has ALL required skills at Advanced/Expert level, plus several nice-to-have skills
   - 75–89:  Has most required skills at Intermediate+ level, minor gaps in non-critical areas
   - 60–74:  Has core required skills but missing some; adjacent skills compensate partially
   - 40–59:  Missing several required skills; only partial technical overlap
   - 0–39:   Significant skill mismatch; would require substantial retraining

2. EXPERIENCE RELEVANCE (30% weight)
   - 90–100: Exceeds experience requirement; roles at directly relevant companies/domains
   - 75–89:  Meets experience requirement; strong domain overlap in work history
   - 60–74:  Slightly below required years OR adjacent domain experience
   - 40–59:  Notably below required years OR mostly unrelated roles
   - 0–39:   Far below requirement; experience largely irrelevant

3. EDUCATION FIT (20% weight) — Required level: ${educationReq}
   ${educationReq === 'Any' ? `- Any educational background is accepted; score based on relevance of field and any certifications.
   - 90–100: Advanced degree in directly relevant field + strong certifications
   - 75–89:  Bachelor's in relevant field, or strong certifications compensate
   - 60–74:  Adjacent field degree, or solid certifications with good experience
   - 40–59:  Limited formal education but some relevant certifications
   - 0–39:   No relevant education or certifications` :
   educationReq === 'High School' ? `- High School diploma is the minimum; higher qualifications score better.
   - 90–100: University degree in relevant field + strong certifications
   - 75–89:  Diploma or partial university education + relevant certifications
   - 60–74:  High School + strong self-learning evidence (certifications, projects)
   - 40–59:  High School only, limited certifications
   - 0–39:   No evidence of High School completion` :
   educationReq === "Bachelor's" ? `- Bachelor's degree is the minimum requirement.
   - 90–100: Master's or PhD in exact field + strong certifications
   - 75–89:  Bachelor's in directly relevant field + certifications
   - 60–74:  Bachelor's in adjacent field, or strong certifications compensate
   - 40–59:  Incomplete degree but relevant certifications present
   - 0–39:   No Bachelor's degree and no compensating certifications` :
   educationReq === "Master's" ? `- Master's degree is the minimum requirement.
   - 90–100: PhD or Master's in exact field + research/publications
   - 75–89:  Master's in relevant field + strong certifications
   - 60–74:  Bachelor's + highly relevant certifications (may compensate)
   - 40–59:  Bachelor's only with limited additional qualifications
   - 0–39:   Below Bachelor's level` :
   educationReq === 'PhD' ? `- PhD is the minimum requirement for this role.
   - 90–100: PhD in exact field + publications/research output
   - 75–89:  PhD in adjacent field or Master's + exceptional experience
   - 60–74:  Master's in relevant field (significant gap from requirement)
   - 40–59:  Bachelor's only
   - 0–39:   No advanced degree` :
   `- Professional Certification is required.
   - 90–100: Multiple highly relevant industry certifications + formal degree
   - 75–89:  One or more relevant certifications + solid academic background
   - 60–74:  Relevant certifications without formal degree
   - 40–59:  General certifications, not directly relevant
   - 0–39:   No professional certifications`}

4. OVERALL RELEVANCE (15% weight)
   - 90–100: Exceptional career trajectory, projects directly relevant, clear growth pattern
   - 75–89:  Good progression, some relevant projects, strong overall profile
   - 60–74:  Decent progression, partial project relevance
   - 40–59:  Inconsistent career path, limited relevant projects
   - 0–39:   Poor fit — career direction misaligned with role

=== COMPOSITE SCORE FORMULA ===
Composite = (skillsScore × 0.35) + (experienceScore × 0.30) + (educationScore × 0.20) + (relevanceScore × 0.15)

hiringSuggestion rules:
- "Strong Yes" → composite ≥ 85  (pursue immediately, highly competitive candidate)
- "Yes"        → composite 70–84 (strong candidate, worth interviewing)
- "Maybe"      → composite 50–69 (has potential, but notable gaps — use judgement)
- "No"         → composite < 50  (does not meet minimum requirements)

=== CANDIDATES TO EVALUATE ===
${candidateList}

=== OUTPUT FORMAT ===
Return ONLY a raw JSON array — absolutely no markdown fences, no preamble, no explanation.
Each element must follow this exact schema:
[
  {
    "candidateIndex": 0,
    "skillsScore": 87,
    "experienceScore": 82,
    "educationScore": 75,
    "relevanceScore": 80,
    "strengths": [
      "Advanced React and TypeScript with 4+ years demonstrated in production",
      "Led 3-person frontend team at Andela — relevant leadership for this role",
      "Open-source contributions to relevant tooling demonstrate initiative"
    ],
    "gaps": [
      "No direct experience with GraphQL (listed as required)",
      "Python skills listed as Beginner — backend tasks may require upskilling"
    ],
    "recommendation": "Strong frontend engineer with proven team experience. The GraphQL gap is bridgeable given their REST expertise and fast learning track record. Recommend for technical interview. Ask about backend API integration experience.",
    "hiringSuggestion": "Yes"
  }
]

IMPORTANT:
- strengths and gaps must be specific, evidence-based sentences — not generic statements
- recommendation must be 2–3 actionable sentences a recruiter can use
- Output ONLY the JSON array. Nothing else.`;
}

/* ─── Response parser with validation ────────────────────────────── */
function parseResponse(raw: string): GeminiScreeningItem[] {
  const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end   = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Gemini response did not contain a JSON array');
  const items: GeminiScreeningItem[] = JSON.parse(cleaned.slice(start, end + 1));

  // Validate and clamp each item
  return items.map((item) => ({
    candidateIndex:  item.candidateIndex  ?? 0,
    skillsScore:     Math.min(100, Math.max(0, Number(item.skillsScore)     || 0)),
    experienceScore: Math.min(100, Math.max(0, Number(item.experienceScore) || 0)),
    educationScore:  Math.min(100, Math.max(0, Number(item.educationScore)  || 0)),
    relevanceScore:  Math.min(100, Math.max(0, Number(item.relevanceScore)  || 0)),
    strengths:       Array.isArray(item.strengths) ? item.strengths.filter(Boolean) : [],
    gaps:            Array.isArray(item.gaps)      ? item.gaps.filter(Boolean)      : [],
    recommendation:  item.recommendation   || '',
    hiringSuggestion: (['Strong Yes', 'Yes', 'Maybe', 'No'] as const).includes(item.hiringSuggestion)
      ? item.hiringSuggestion
      : 'Maybe',
  }));
}

/* ─── Single chunk screener with retry ───────────────────────────── */
async function screenChunk(
  model: ReturnType<typeof genAI.getGenerativeModel>,
  job: Job,
  chunk: TalentProfile[],
  attempt = 1
): Promise<GeminiScreeningItem[]> {
  try {
    const prompt = buildPrompt(job, chunk);
    const result = await model.generateContent(prompt);
    return parseResponse(result.response.text());
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt)); // backoff: 2s, 4s
      return screenChunk(model, job, chunk, attempt + 1);
    }
    throw err;
  }
}

/* ─── Resume parser — extracts structured profile from PDF text ───── */

export interface ParsedResume {
  /* Contact info — extracted directly from the resume */
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  /* Professional data */
  currentRole?: string;
  experienceYears: number;
  skills: Array<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'; yearsOfExperience?: number }>;
  experience: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    fieldOfStudy: string;
    institution: string;
    startYear?: number;
    endYear?: number;
  }>;
  certifications?: Array<{ name: string; issuer?: string; issueDate?: string }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    role?: string;
    link?: string;
    startDate?: string;
    endDate?: string;
  }>;
  languages?: Array<{ name: string; proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native' }>;
  availability?: {
    status: 'Available' | 'Open to Opportunities' | 'Not Available';
    type?: 'Full-time' | 'Part-time' | 'Contract';
    startDate?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    website?: string;
  };
  summary?: string;
}

/**
 * RESUME_PARSE_PROMPT
 * Gemini prompt sent for every PDF/resume uploaded.
 * Extracts ALL candidate info — contact details + professional profile.
 */
export const RESUME_PARSE_PROMPT = (resumeText: string): string =>
  `You are an expert resume parser for UmuravaHire AI — a recruitment intelligence platform.
Your task is to extract ALL structured information from the resume below.

RESUME TEXT:
${resumeText.slice(0, 8000)}

Return ONLY a raw JSON object — no markdown fences, no preamble, no explanation.
Use this exact schema (include every field present in the resume):
{
  "name": "Alice Nkurunziza",
  "email": "alice@example.com",
  "phone": "+250788000001",
  "location": "Kigali, Rwanda",
  "currentRole": "Senior Frontend Engineer",
  "experienceYears": 5,
  "skills": [
    { "name": "React", "level": "Advanced", "yearsOfExperience": 4 },
    { "name": "TypeScript", "level": "Advanced", "yearsOfExperience": 3 }
  ],
  "experience": [
    {
      "company": "Andela",
      "role": "Frontend Engineer",
      "startDate": "2021-03",
      "endDate": "Present",
      "isCurrent": true,
      "description": "Led frontend guild and mentored 5 junior engineers.",
      "technologies": ["React", "TypeScript", "GraphQL"]
    }
  ],
  "education": [
    {
      "degree": "BSc",
      "fieldOfStudy": "Computer Science",
      "institution": "University of Rwanda",
      "startYear": 2016,
      "endYear": 2020
    }
  ],
  "certifications": [
    { "name": "AWS Developer Associate", "issuer": "Amazon", "issueDate": "2023-06" }
  ],
  "projects": [
    {
      "name": "AI Recruitment System",
      "description": "AI-powered candidate screening platform built with Next.js and Gemini API.",
      "technologies": ["Next.js", "Node.js", "Gemini API", "MongoDB"],
      "role": "Backend Engineer",
      "link": "https://github.com/alice/ai-recruit",
      "startDate": "2023-01",
      "endDate": "2023-06"
    }
  ],
  "languages": [
    { "name": "English", "proficiency": "Fluent" },
    { "name": "Kinyarwanda", "proficiency": "Native" }
  ],
  "availability": {
    "status": "Available",
    "type": "Full-time",
    "startDate": "2024-02-01"
  },
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/alice-nkurunziza",
    "github": "https://github.com/alice",
    "portfolio": "https://alice.dev"
  },
  "summary": "Concise professional summary extracted from the resume."
}

Extraction rules:
- name: The candidate's full name is the VERY FIRST piece of text at the top of the resume — it is the bold heading that appears before any contact details, job title, or summary. It is typically 2–3 words (First Last or First Middle Last), contains only letters/hyphens/spaces, and has NO digits or @ symbols. Extract it exactly as written. Do NOT confuse it with a company name, job title, university name, or section heading.
- email: email address from contact section
- phone: phone number from contact section (include country code if present)
- location: Look ONLY in the contact/header section (first ~15 lines) for fields labeled "Address", "Location", "City", "Country", or any line that looks like a postal/street address. Extract the city and country (e.g. "Kigali, Rwanda"). If only a street address is found, derive the city and country from it. If NO address or location is found anywhere in the resume, omit this field entirely — do NOT guess or invent a location.
- currentRole: most recent job title
- experienceYears: total years of professional work experience (integer)
- skills: EVERY technology, framework, language, library, and tool mentioned
  - level must be exactly one of: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  - infer level from context (seniority words, years of use, "lead", "expert", "proficient")
- experience: all work history entries in reverse chronological order
  - dates in "YYYY-MM" format; use "Present" for current roles
- education: all academic qualifications
- certifications: all professional certifications or courses with issueDate if mentioned
- projects: ALL portfolio projects, personal projects, academic projects, or notable work mentioned
  - include link if a URL is present
  - technologies: all tools/frameworks used in the project
- languages: ALL human languages the candidate speaks (English, French, Kinyarwanda, etc.)
  - proficiency must be exactly one of: "Basic" | "Conversational" | "Fluent" | "Native"
- availability: infer from resume context if stated (e.g. "available immediately", "notice period: 1 month", "open to opportunities")
  - status: "Available" | "Open to Opportunities" | "Not Available"
  - type: "Full-time" | "Part-time" | "Contract" (if stated)
- socialLinks: extract ALL URLs found — LinkedIn, GitHub, portfolio, personal website
  - look for linkedin.com, github.com, or any other profile/portfolio URLs in the contact section
- summary: 2–3 sentence professional summary (from resume or inferred)
- Use [] for arrays when no data is found; omit optional fields entirely if unknown
- Return ONLY the JSON object`;

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.05, maxOutputTokens: 4096 },
  });

  const result = await model.generateContent(RESUME_PARSE_PROMPT(resumeText));
  const raw    = result.response.text();

  const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Resume parse: no JSON object found in Gemini response');

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as ParsedResume;

  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
  if (Array.isArray(parsed.skills)) {
    parsed.skills = parsed.skills.map((s) => ({
      ...s,
      level: validLevels.includes(s.level as any) ? s.level : 'Intermediate',
    }));
  }

  return parsed;
}

/* ─── CSV parser — Gemini reads CSV rows and returns structured profiles ── */

/**
 * CSV_PARSE_PROMPT
 * Gemini prompt sent for every CSV file uploaded.
 * Handles any column layout — Gemini infers structure from headers and values.
 */
export const CSV_PARSE_PROMPT = (csvText: string): string =>
  `You are an expert HR data parser for UmuravaHire AI — a recruitment intelligence platform.
Your task is to parse the CSV candidate data below and return ALL rows as structured talent profiles.

CSV DATA:
${csvText.slice(0, 12000)}

Return ONLY a raw JSON array — no markdown fences, no preamble, no explanation.
Each element must follow this exact schema:
[
  {
    "firstName": "Alice",
    "lastName": "Nkurunziza",
    "email": "alice@example.com",
    "phone": "+250788000001",
    "location": "Kigali, Rwanda",
    "currentRole": "Senior Frontend Engineer",
    "headline": "Senior Frontend Engineer",
    "experienceYears": 5,
    "skills": [
      { "name": "React", "level": "Advanced", "yearsOfExperience": 4 },
      { "name": "TypeScript", "level": "Advanced", "yearsOfExperience": 3 }
    ],
    "education": [
      {
        "degree": "BSc",
        "fieldOfStudy": "Computer Science",
        "institution": "University of Rwanda",
        "endYear": 2018
      }
    ],
    "certifications": [],
    "projects": [],
    "languages": [{ "name": "English", "proficiency": "Fluent" }],
    "availability": { "status": "Available", "type": "Full-time" },
    "socialLinks": { "linkedin": "https://linkedin.com/in/alice", "github": "" },
    "bio": "Full-stack developer with 5 years of startup experience."
  }
]

Parsing rules:
- Extract EVERY data row (skip the header row)
- Map column headers intelligently — e.g. "full_name" → firstName+lastName, "exp" → experienceYears
- For skills columns with pipe-separated entries like "React:Advanced:4|TypeScript:Advanced:3":
  parse each entry as { name, level, yearsOfExperience }
- For comma/space separated skill lists (e.g. "Python, Django, Flask"), infer level as "Intermediate"
- skill.level must be exactly one of: "Beginner" | "Intermediate" | "Advanced" | "Expert"
- language.proficiency must be exactly one of: "Basic" | "Conversational" | "Fluent" | "Native"
- availability.status must be: "Available" | "Open to Opportunities" | "Not Available"
- experienceYears must be an integer (0 if unknown)
- firstName is required — derive from name/fullName column if needed
- email: use value from CSV or "" if missing
- projects: map from any projects column (pipe-separated or JSON)
- socialLinks: map linkedin/github/portfolio columns if present
- Use [] for missing arrays, "" for missing strings, omit availability if no data
- Return ONLY the JSON array`;

export async function parseCSVWithGemini(csvText: string): Promise<any[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.05, maxOutputTokens: 8192 },
  });

  const result  = await model.generateContent(CSV_PARSE_PROMPT(csvText));
  const raw     = result.response.text();
  const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start   = cleaned.indexOf('[');
  const end     = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('CSV parse: no JSON array found in Gemini response');

  const profiles = JSON.parse(cleaned.slice(start, end + 1));

  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  return profiles.map((p: any) => ({
    ...p,
    skills: Array.isArray(p.skills)
      ? p.skills.map((s: any) => ({
          name:  s.name || String(s),
          level: validLevels.includes(s.level) ? s.level : 'Intermediate',
          ...(s.yearsOfExperience ? { yearsOfExperience: Number(s.yearsOfExperience) } : {}),
        }))
      : [],
    experienceYears: Number(p.experienceYears) || 0,
  }));
}

/* ─── Rule-based fallback (used when Gemini quota is exceeded) ───── */
export function ruleBasedScreening(
  job: Job,
  applicants: TalentProfile[]
): Omit<ScreeningResult, '_id' | 'createdAt'>[] {
  const reqLower = job.requiredSkills.map((s) => s.toLowerCase());

  const scored = applicants.map((a, idx) => {
    const candidateSkills = (a.skills ?? []).map((s) =>
      ((s as any).name ?? String(s)).toLowerCase()
    );

    // Skills: how many required skills does the candidate have?
    const matched = reqLower.filter((rs) =>
      candidateSkills.some((cs) => cs.includes(rs) || rs.includes(cs))
    );
    const skillsScore = Math.round(Math.min(100,
      reqLower.length > 0 ? (matched.length / reqLower.length) * 100 : 50
    ));

    // Experience: ratio to requirement, capped at 100
    const expRatio = a.experienceYears / Math.max(job.experienceYears, 1);
    const experienceScore = Math.round(Math.min(100,
      expRatio >= 1
        ? 75 + Math.min(25, (a.experienceYears - job.experienceYears) * 5)
        : expRatio * 75
    ));

    // Education: presence + basic degree detection
    const bioLower = `${a.bio ?? ''} ${a.summary ?? ''}`.toLowerCase();
    const hasDegree = (a.education?.length ?? 0) > 0
      || /bsc|msc|bachelor|master|phd|degree/.test(bioLower);
    const educationScore = hasDegree ? 70 : 40;

    // Relevance: keyword density in bio / headline / role
    const fullText = `${a.headline ?? ''} ${a.bio ?? ''} ${a.currentRole ?? ''} ${a.summary ?? ''}`.toLowerCase();
    const relevantHits = reqLower.filter((s) => fullText.includes(s));
    const relevanceScore = Math.round(Math.min(100,
      40 + (reqLower.length > 0 ? (relevantHits.length / reqLower.length) * 60 : 0)
    ));

    const composite = skillsScore * 0.35 + experienceScore * 0.30 + educationScore * 0.20 + relevanceScore * 0.15;
    const missing = reqLower.filter((rs) => !candidateSkills.some((cs) => cs.includes(rs) || rs.includes(cs)));

    let hiringSuggestion: GeminiScreeningItem['hiringSuggestion'];
    if (composite >= 85)      hiringSuggestion = 'Strong Yes';
    else if (composite >= 70) hiringSuggestion = 'Yes';
    else if (composite >= 50) hiringSuggestion = 'Maybe';
    else                      hiringSuggestion = 'No';

    return {
      _composite: composite,
      idx,
      talent: a,
      skillsScore,
      experienceScore,
      educationScore,
      relevanceScore,
      strengths: [
        matched.length > 0
          ? `Matches ${matched.length}/${reqLower.length} required skill${matched.length !== 1 ? 's' : ''}: ${matched.slice(0, 3).join(', ')}`
          : 'Broad technical background — full AI analysis recommended',
        a.experienceYears >= job.experienceYears
          ? `Meets experience requirement (${a.experienceYears}y vs ${job.experienceYears}y required)`
          : '',
        hasDegree ? 'Has relevant educational background' : '',
      ].filter(Boolean) as string[],
      gaps: [
        missing.length > 0 ? `Missing required skills: ${missing.slice(0, 3).join(', ')}` : '',
        a.experienceYears < job.experienceYears
          ? `Below experience requirement (${a.experienceYears}y vs ${job.experienceYears}y required)`
          : '',
      ].filter(Boolean) as string[],
      recommendation: `Rule-based assessment: ${composite >= 70 ? 'Candidate meets key criteria' : 'Notable gaps identified'}. `
        + `Skills match: ${matched.length}/${reqLower.length} required. `
        + `Experience: ${a.experienceYears}y (${job.experienceYears}y required). `
        + `Run full AI screening with a valid Gemini API key for detailed analysis.`,
      hiringSuggestion,
    };
  });

  return scored
    .sort((a, b) => b._composite - a._composite)
    .map(({ _composite, idx, talent, ...rest }, rank) => ({
      jobId:    job._id,
      talentId: talent._id,
      rank:     rank + 1,
      matchScore: Math.round(rest.skillsScore * 0.35 + rest.experienceScore * 0.30 + rest.educationScore * 0.20 + rest.relevanceScore * 0.15),
      scoreBreakdown: {
        skills:     Math.round(rest.skillsScore),
        experience: Math.round(rest.experienceScore),
        education:  Math.round(rest.educationScore),
        relevance:  Math.round(rest.relevanceScore),
      },
      strengths:        rest.strengths,
      gaps:             rest.gaps,
      recommendation:   rest.recommendation,
      hiringSuggestion: rest.hiringSuggestion,
    }));
}

/* ─── Main export ─────────────────────────────────────────────────── */
export async function screenApplicants(
  job: Job,
  applicants: TalentProfile[]
): Promise<Omit<ScreeningResult, '_id' | 'createdAt'>[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.15, maxOutputTokens: 8192 },
  });

  // Split into chunks for large batches
  const chunks: TalentProfile[][] = [];
  for (let i = 0; i < applicants.length; i += CHUNK_SIZE) {
    chunks.push(applicants.slice(i, i + CHUNK_SIZE));
  }

  // Process chunks sequentially (avoids rate-limit collisions)
  const allItems: (Omit<ScreeningResult, '_id' | 'createdAt'> & { _composite: number })[] = [];

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk      = chunks[ci];
    const chunkStart = ci * CHUNK_SIZE;
    const items      = await screenChunk(model, job, chunk);

    for (const item of items) {
      const globalIdx = chunkStart + item.candidateIndex;
      const talent    = applicants[globalIdx];
      if (!talent) continue;

      const composite =
        item.skillsScore     * 0.35 +
        item.experienceScore * 0.30 +
        item.educationScore  * 0.20 +
        item.relevanceScore  * 0.15;

      // Override hiringSuggestion to be consistent with composite
      let hiringSuggestion: GeminiScreeningItem['hiringSuggestion'];
      if (composite >= 85)      hiringSuggestion = 'Strong Yes';
      else if (composite >= 70) hiringSuggestion = 'Yes';
      else if (composite >= 50) hiringSuggestion = 'Maybe';
      else                      hiringSuggestion = 'No';

      allItems.push({
        jobId:    job._id,
        talentId: talent._id,
        rank:     0,
        matchScore: Math.round(composite),
        scoreBreakdown: {
          skills:     Math.round(item.skillsScore),
          experience: Math.round(item.experienceScore),
          education:  Math.round(item.educationScore),
          relevance:  Math.round(item.relevanceScore),
        },
        strengths:        item.strengths,
        gaps:             item.gaps,
        recommendation:   item.recommendation,
        hiringSuggestion,
        _composite:       composite,
      });
    }
  }

  // Sort descending by composite, assign global ranks
  return allItems
    .sort((a, b) => b._composite - a._composite)
    .map(({ _composite: _, ...rest }, i) => ({ ...rest, rank: i + 1 }));
}
