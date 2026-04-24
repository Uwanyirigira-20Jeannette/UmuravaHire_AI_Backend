import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';

/**
 * POST /api/applicants/import-umurava
 *
 * Body: { jobId: string; profiles: UmuravaProfile[] }
 *
 * Accepted Umurava profile shape (flexible — handles both old and new formats):
 * {
 *   id?: string,
 *   fullName?: string,          // OR firstName + lastName
 *   firstName?: string,
 *   lastName?: string,
 *   email: string,
 *   phone?: string,
 *   headline?: string,
 *   bio?: string,
 *   location?: string,
 *   skills: string[] | { name, level?, yearsOfExperience? }[],
 *   yearsOfExperience?: number,
 *   currentTitle?: string,
 *   experience?: WorkExperience[],
 *   education?: { level/degree, field/fieldOfStudy, school/institution, year/endYear? }[],
 *   certifications?: Certification[],
 *   projects?: Project[],
 *   languages?: Language[],
 *   availability?: Availability,
 *   socialLinks?: SocialLinks
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { jobId, profiles } = body as { jobId: string; profiles: any[] };

    if (!jobId || !Array.isArray(profiles) || profiles.length === 0)
      return NextResponse.json({ message: 'jobId and a non-empty profiles array are required' }, { status: 400 });

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    const mapped = profiles.map((p: any) => {
      // Resolve firstName / lastName from various sources
      const fullName  = p.fullName || p.name || '';
      const firstName = p.firstName || fullName.split(' ')[0] || 'Unknown';
      const lastName  = p.lastName  || fullName.split(' ').slice(1).join(' ') || '';

      // Skills: normalise to { name, level, yearsOfExperience? }
      let skills: any[] = [];
      if (Array.isArray(p.skills)) {
        skills = p.skills.map((s: any) =>
          typeof s === 'string'
            ? { name: s, level: 'Intermediate' }
            : { name: s.name || s, level: s.level || 'Intermediate', yearsOfExperience: s.yearsOfExperience }
        );
      }

      // Education: normalise field names
      const education: any[] = (p.education || []).map((e: any) => ({
        degree:       e.degree  || e.level  || '',
        fieldOfStudy: e.fieldOfStudy || e.field || e.major || '',
        institution:  e.institution  || e.school || '',
        startYear:    e.startYear,
        endYear:      e.endYear || e.year,
      }));

      return {
        jobId,
        firstName,
        lastName,
        headline:        p.headline || p.currentTitle || p.currentRole || 'Talent',
        email:           p.email || '',
        phone:           p.phone,
        location:        p.location || 'Not specified',
        skills,
        experienceYears: Number(p.yearsOfExperience ?? p.experienceYears ?? 0),
        currentRole:     p.currentTitle || p.currentRole,
        education,
        experience:      Array.isArray(p.experience)     ? p.experience     : [],
        certifications:  Array.isArray(p.certifications) ? p.certifications : [],
        projects:        Array.isArray(p.projects)       ? p.projects       : [],
        languages:       Array.isArray(p.languages)      ? p.languages      : [],
        availability:    p.availability,
        socialLinks:     p.socialLinks,
        bio:             p.bio || p.summary,
        source:          'umurava' as const,
      };
    });

    const inserted = await TalentProfile.insertMany(mapped, { ordered: false });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: inserted.length } });

    return NextResponse.json({ inserted: inserted.length, applicants: inserted });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
