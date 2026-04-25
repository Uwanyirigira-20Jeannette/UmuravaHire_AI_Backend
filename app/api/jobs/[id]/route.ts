export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';
import ScreeningResult from '@/models/ScreeningResult';

// PATCH /api/jobs/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const job = await Job.findByIdAndUpdate(params.id, { $set: body }, { new: true, runValidators: true }).lean();
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// GET /api/jobs/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const job = await Job.findById(params.id).lean();
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] — also removes applicants & screening results for that job
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const job = await Job.findByIdAndDelete(params.id);
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    await Promise.all([
      TalentProfile.deleteMany({ jobId: params.id }),
      ScreeningResult.deleteMany({ jobId: params.id }),
    ]);
    return NextResponse.json({ message: 'Job deleted' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
