import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TalentProfile from '@/models/TalentProfile';
import Job from '@/models/Job';

// DELETE /api/applicants/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const profile = await TalentProfile.findByIdAndDelete(params.id);
    if (!profile) return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    // Decrement job applicant count
    await Job.findByIdAndUpdate(profile.jobId, { $inc: { applicantCount: -1 } });
    return NextResponse.json({ message: 'Applicant removed' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
