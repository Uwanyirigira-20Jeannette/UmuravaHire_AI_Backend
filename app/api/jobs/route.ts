export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';
import ScreeningResult from '@/models/ScreeningResult';

// GET /api/jobs — all jobs with applicant count
export async function GET() {
  try {
    await connectDB();
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// POST /api/jobs — create a new job
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, department, description, requiredSkills, niceToHaveSkills, location, experienceYears, shortlistTarget } = body;

    if (!title || !department || !requiredSkills?.length || experienceYears == null)
      return NextResponse.json({ message: 'title, department, requiredSkills, experienceYears are required' }, { status: 400 });

    const job = await Job.create({ title, department, description, requiredSkills, niceToHaveSkills: niceToHaveSkills ?? [], location: location || 'Remote', experienceYears, shortlistTarget });
    return NextResponse.json(job.toObject(), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
