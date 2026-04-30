export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';
import pdfParse from 'pdf-parse';
import { parseResume, parseCSVWithGemini } from '@/lib/gemini';

/* ── Sanitize helpers ───────────────────────────────────────────────
   Ensure every sub-document has the values Mongoose expects.
   Gemini sometimes returns partial objects — we fill gaps rather
   than letting validation reject the entire insertMany batch.
─────────────────────────────────────────────────────────────────── */

function sanitizeExperience(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      company:      String(e.company      || 'Unknown').trim(),
      role:         String(e.role         || 'Unknown').trim(),
      startDate:    String(e.startDate    || '').trim(),
      endDate:      e.endDate    ? String(e.endDate).trim()    : undefined,
      description:  e.description ? String(e.description).trim() : undefined,
      technologies: Array.isArray(e.technologies) ? e.technologies.map(String).filter(Boolean) : [],
      isCurrent:    Boolean(e.isCurrent),
    }));
}

function sanitizeEducation(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      institution:  String(e.institution  || '').trim(),
      degree:       String(e.degree       || '').trim(),
      fieldOfStudy: String(e.fieldOfStudy || e.field || e.major || '').trim(),
      startYear:    e.startYear ? Number(e.startYear) : undefined,
      endYear:      e.endYear   ? Number(e.endYear)   : undefined,
    }));
}

function sanitizeCertifications(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((c) => c && (c.name || c.title))
    .map((c) => ({
      name:      String(c.name || c.title || '').trim(),
      issuer:    c.issuer    ? String(c.issuer).trim()    : undefined,
      issueDate: c.issueDate ? String(c.issueDate).trim() : undefined,
    }));
}

function sanitizeProjects(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((p) => p && (p.name || p.title))
    .map((p) => ({
      name:         String(p.name || p.title || '').trim(),
      description:  p.description  ? String(p.description).trim()  : undefined,
      technologies: Array.isArray(p.technologies) ? p.technologies.map(String).filter(Boolean) : [],
      role:         p.role  ? String(p.role).trim()  : undefined,
      link:         p.link  ? String(p.link).trim()  : undefined,
      startDate:    p.startDate ? String(p.startDate).trim() : undefined,
      endDate:      p.endDate   ? String(p.endDate).trim()   : undefined,
    }));
}

function sanitizeLanguages(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  const validProf = ['Basic', 'Conversational', 'Fluent', 'Native'];
  return arr
    .filter((l) => l && (typeof l === 'string' || l.name))
    .map((l) => ({
      name:        String(typeof l === 'string' ? l : l.name).trim(),
      proficiency: validProf.includes(l.proficiency) ? l.proficiency : 'Conversational',
    }))
    .filter((l) => l.name.length > 0);
}

function sanitizeAvailability(obj: any): any | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const validStatus = ['Available', 'Open to Opportunities', 'Not Available'];
  const validType   = ['Full-time', 'Part-time', 'Contract'];
  return {
    status:    validStatus.includes(obj.status) ? obj.status : 'Available',
    type:      validType.includes(obj.type)     ? obj.type   : undefined,
    startDate: obj.startDate ? String(obj.startDate).trim() : undefined,
  };
}

function sanitizeSocialLinks(obj: any): any | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const result: Record<string, string> = {};
  for (const key of ['linkedin', 'github', 'portfolio', 'twitter', 'website'] as const) {
    if (obj[key] && typeof obj[key] === 'string' && obj[key].trim()) {
      result[key] = obj[key].trim();
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeSkills(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  return arr
    .filter((s) => s && (typeof s === 'string' || s.name))
    .map((s) => ({
      name:              String(typeof s === 'string' ? s : s.name).trim(),
      level:             validLevels.includes(s.level) ? s.level : 'Intermediate',
      yearsOfExperience: s.yearsOfExperience ? Number(s.yearsOfExperience) : undefined,
    }))
    .filter((s) => s.name.length > 0);
}

/* ── Fallback: manual CSV parser ─────────────────────────────────── */
function parseCSVManual(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const fields: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    fields.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (fields[i] || '').replace(/^"|"$/g, ''); });
    return row;
  }).filter((r) => r.firstName || r.lastName || r.name || r.email);
}

function parseSkillsString(raw: string) {
  return raw.split(/[|;]/).map((s) => s.trim()).filter(Boolean).map((s) => {
    const [name, level, years] = s.split(':').map((p) => p.trim());
    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    return {
      name,
      level: validLevels.includes(level) ? level as any : 'Intermediate',
      ...(years && !isNaN(Number(years)) ? { yearsOfExperience: Number(years) } : {}),
    };
  }).filter((s) => s.name);
}

function manualRowToTalent(row: Record<string, string>, jobId: string, jobTitle: string) {
  const firstName = row.firstName || (row.name || row.fullName || '').split(' ')[0] || 'Unknown';
  const lastName  = row.lastName  || (row.name || row.fullName || '').split(' ').slice(1).join(' ') || '';
  return {
    jobId, firstName, lastName,
    headline:        row.headline || row.currentRole || row.role || jobTitle,
    email:           row.email    || '',
    phone:           row.phone    || undefined,
    location:        row.location || row.city || '—',
    skills:          sanitizeSkills(row.skills ? parseSkillsString(row.skills) : []),
    education:       sanitizeEducation(row.degree ? [{ degree: row.degree, fieldOfStudy: row.fieldOfStudy || '', institution: row.institution || '' }] : []),
    experience:      [],
    certifications:  [],
    experienceYears: Number(row.experienceYears || row.experience || 0),
    currentRole:     row.currentRole || row.role || row.position || jobTitle,
    bio:             row.bio || row.summary || undefined,
    source:          'csv' as const,
  };
}

/* ── Fallback skill extractor for PDF when Gemini is unavailable ── */
const KNOWN_SKILLS = [
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Ruby','PHP',
  'Swift','Kotlin','Dart','Scala','R','Perl','Elixir',
  'React','Vue.js','Angular','Next.js','Nuxt.js','Svelte',
  'Redux','Webpack','Vite','Jest','Cypress','Playwright',
  'HTML','CSS','SASS','Tailwind CSS','Bootstrap','Material UI',
  'Node.js','Express','Fastify','NestJS','FastAPI','Django','Flask',
  'Spring Boot','Laravel','Rails','ASP.NET','.NET',
  'GraphQL','REST','gRPC','WebSockets','Microservices','RabbitMQ','Kafka',
  'MongoDB','PostgreSQL','MySQL','SQLite','Redis','Elasticsearch','DynamoDB',
  'Firebase','Supabase','BigQuery','dbt',
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','Ansible',
  'Jenkins','GitHub Actions','GitLab CI','CI/CD','Linux','Bash',
  'React Native','Flutter','iOS','Android','SwiftUI',
  'TensorFlow','PyTorch','scikit-learn','Pandas','NumPy','OpenCV',
  'Machine Learning','Deep Learning','NLP','LLM',
  'Hugging Face','LangChain','Apache Spark',
  'Power BI','Tableau','Git','GitHub','Figma','Postman',
  'SQL','Agile','Scrum','DevOps','OWASP','OAuth','JWT',
];

function extractSkillsFallback(text: string): Array<{ name: string; level: 'Intermediate' }> {
  const found = new Map<string, boolean>();
  const lower = text.toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    if (lower.includes(skill.toLowerCase())) found.set(skill, true);
  }
  return Array.from(found.keys()).map((name) => ({ name, level: 'Intermediate' as const }));
}

function extractExperienceFallback(text: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/i,
    /experience[:\s]+(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs?\s+(?:of\s+)?experience/i,
    /over\s+(\d+)\s+years?\s+(?:of\s+)?experience/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Math.min(Number(m[1]), 50);
  }
  return 0;
}

/* Try to find email in raw PDF text as a last resort */
function extractEmailFallback(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : '';
}

/* Try to extract location / city-country from Address or Location line in PDF text */
function extractLocationFallback(text: string): string {
  // Match labeled lines: "Address:", "Location:", "City:", "Residence:", "Place:"
  const labeled = text.match(
    /(?:Address|Location|City|Residence|Place|Based in)[:\s]+([^\n\r]{3,80})/i
  );
  if (labeled) {
    const raw = labeled[1].trim();
    // If it looks like a street address, extract the last meaningful segment (city, country)
    // e.g. "123 Main St, Kigali, Rwanda" → "Kigali, Rwanda"
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Drop numeric/street parts (those that start with a digit or contain "Street/Ave/Rd/St")
      const city = parts.find(
        (p) => !/^\d/.test(p) && !/\b(street|avenue|road|ave|blvd|st\b|rd\b|lane|drive|no\.|p\.?o\.?\s*box)/i.test(p)
      );
      const country = parts[parts.length - 1];
      if (city && city !== country) return `${city}, ${country}`;
      return country;
    }
    // Single-segment value — return as-is if it looks like a place name
    if (!/^\d/.test(raw)) return raw;
  }
  return '';
}

/* ── POST /api/applicants/upload ────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const jobId    = formData.get('jobId') as string | null;

    if (!file || !jobId) {
      return NextResponse.json({ message: 'file and jobId are required' }, { status: 400 });
    }

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    const jobTitle = job.title as string;
    const fileExt  = file.name.toLowerCase();
    let profiles: any[] = [];

    /* ── CSV / JSON ───────────────────────────────────────────────── */
    if (fileExt.endsWith('.csv') || fileExt.endsWith('.json') || file.type === 'text/csv') {
      const text = await file.text();

      if (fileExt.endsWith('.json')) {
        const arr: any[] = JSON.parse(text);
        profiles = arr.map((r) => ({
          jobId,
          firstName:       r.firstName || (r.name || '').split(' ')[0] || 'Unknown',
          lastName:        r.lastName  || (r.name || '').split(' ').slice(1).join(' ') || '',
          headline:        r.headline  || r.currentRole || r.currentTitle || jobTitle,
          email:           r.email     || '',
          phone:           r.phone     || undefined,
          location:        r.location  || '—',
          skills:          sanitizeSkills(r.skills ?? []),
          experienceYears: Number(r.yearsOfExperience || r.experienceYears || 0),
          currentRole:     r.currentRole || r.currentTitle || jobTitle,
          education:       sanitizeEducation(r.education ?? []),
          experience:      sanitizeExperience(r.experience ?? []),
          certifications:  sanitizeCertifications(r.certifications ?? []),
          projects:        sanitizeProjects(r.projects ?? []),
          languages:       sanitizeLanguages(r.languages ?? []),
          availability:    sanitizeAvailability(r.availability),
          socialLinks:     sanitizeSocialLinks(r.socialLinks),
          bio:             r.bio || r.summary || undefined,
          source:          'umurava' as const,
        }));
      } else {
        /* CSV — Gemini first, manual fallback */
        try {
          const geminiProfiles = await parseCSVWithGemini(text);
          profiles = geminiProfiles.map((p) => ({
            jobId,
            firstName:       p.firstName || (p.name || '').split(' ')[0] || 'Unknown',
            lastName:        p.lastName  || (p.name || '').split(' ').slice(1).join(' ') || '',
            headline:        p.headline  || p.currentRole || jobTitle,
            email:           p.email     || '',
            phone:           p.phone     || undefined,
            location:        p.location  || 'Not specified',
            skills:          sanitizeSkills(p.skills ?? []),
            experienceYears: Number(p.experienceYears) || 0,
            currentRole:     p.currentRole || jobTitle,
            education:       sanitizeEducation(p.education ?? []),
            experience:      sanitizeExperience(p.experience ?? []),
            certifications:  sanitizeCertifications(p.certifications ?? []),
            projects:        sanitizeProjects(p.projects ?? []),
            languages:       sanitizeLanguages(p.languages ?? []),
            availability:    sanitizeAvailability(p.availability),
            socialLinks:     sanitizeSocialLinks(p.socialLinks),
            bio:             p.bio || p.summary || undefined,
            source:          'csv' as const,
          }));
        } catch {
          const rows = parseCSVManual(text);
          profiles = rows.map((r) => manualRowToTalent(r, jobId, jobTitle));
        }
      }

    /* ── PDF ──────────────────────────────────────────────────────── */
    } else {
      let pdfText = '';
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await pdfParse(buffer);
        pdfText = result.text || '';
      } catch {
        pdfText = '';
      }

      /* Gemini reads the full resume text and returns structured profile */
      let gemini: Awaited<ReturnType<typeof parseResume>> | null = null;
      if (pdfText.length > 30) {
        try {
          gemini = await parseResume(pdfText);
        } catch {
          /* Gemini failed — fallback extraction below */
        }
      }

      /* Name: Gemini extraction first, then scan first lines of PDF text.
         Never fall back to the filename — it is not the candidate's name. */
      let firstName = 'Candidate';
      let lastName  = '';
      const rawName = gemini?.name?.trim() || '';
      if (rawName) {
        const parts = rawName.split(/\s+/);
        firstName = parts[0] || 'Candidate';
        lastName  = parts.slice(1).join(' ');
      } else {
        // Walk the first 20 lines of the CV — name is always near the very top.
        const candidate = pdfText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .slice(0, 20)
          .find(
            (l) =>
              l.length >= 3 &&
              l.length <= 55 &&
              /^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(l) &&
              /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(l) &&
              !/[@\d]/.test(l) &&
              l.split(/\s+/).length >= 2 &&
              l.split(/\s+/).length <= 5
          );
        if (candidate) {
          const parts = candidate.split(/\s+/);
          firstName = parts[0];
          lastName  = parts.slice(1).join(' ');
        }
      }

      /* Email: Gemini first, then regex scan the raw text */
      const email = gemini?.email?.trim() || extractEmailFallback(pdfText) || '';

      /* Location: Gemini first, then regex scan Address/Location lines, dash if not found */
      const location = gemini?.location?.trim() || extractLocationFallback(pdfText) || '—';

      profiles = [{
        jobId,
        firstName,
        lastName,
        headline:        gemini?.currentRole || jobTitle,
        email,
        phone:           gemini?.phone    || undefined,
        location,
        skills:          sanitizeSkills(gemini?.skills ?? (pdfText.length > 20 ? extractSkillsFallback(pdfText) : [])),
        experienceYears: gemini?.experienceYears ?? (pdfText.length > 20 ? extractExperienceFallback(pdfText) : 0),
        currentRole:     gemini?.currentRole || jobTitle,
        education:       sanitizeEducation(gemini?.education ?? []),
        experience:      sanitizeExperience(gemini?.experience ?? []),
        certifications:  sanitizeCertifications(gemini?.certifications ?? []),
        projects:        sanitizeProjects(gemini?.projects ?? []),
        languages:       sanitizeLanguages(gemini?.languages ?? []),
        availability:    sanitizeAvailability(gemini?.availability),
        socialLinks:     sanitizeSocialLinks(gemini?.socialLinks),
        bio:             gemini?.summary || (pdfText.length > 0 ? pdfText.slice(0, 3000) : `CV: ${file.name}`),
        source:          'pdf' as const,
      }];
    }

    if (profiles.length === 0) {
      return NextResponse.json({ message: 'No valid applicants found in file' }, { status: 400 });
    }

    /* Insert — `ordered: false` so one bad doc doesn't block the rest */
    const inserted   = await TalentProfile.insertMany(profiles, { ordered: false });
    const totalCount = await TalentProfile.countDocuments({ jobId });
    await Job.findByIdAndUpdate(jobId, { applicantCount: totalCount });

    return NextResponse.json({ inserted: inserted.length, total: totalCount, applicants: inserted });
  } catch (err: any) {
    /* Return the real error so the UI can surface it */
    console.error('[upload]', err);
    return NextResponse.json({ message: err.message || 'Upload failed' }, { status: 500 });
  }
}
