export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';
import ScreeningResult from '@/models/ScreeningResult';
import { screenApplicants } from '@/lib/gemini';
import type { Job as JobType, TalentProfile as TalentType } from '@/types';

// POST /api/screening/run
export async function POST(req: NextRequest) {
  let jobId: string | undefined;
  try {
    await connectDB();
    ({ jobId } = await req.json());
    if (!jobId) return NextResponse.json({ message: 'jobId is required' }, { status: 400 });

    const job = await Job.findById(jobId).lean();
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    const applicants = await TalentProfile.find({ jobId }).lean();
    if (applicants.length === 0)
      return NextResponse.json({ message: 'No applicants uploaded for this job' }, { status: 400 });

    // Update job status to screening
    await Job.findByIdAndUpdate(jobId, { status: 'screening' });

    const jobArg  = { ...job, _id: job._id.toString() } as unknown as JobType;
    const talsArg = applicants.map((a) => ({
      ...a,
      _id:   a._id.toString(),
      jobId: a.jobId.toString(),
    })) as unknown as TalentType[];

    // screenApplicants never throws — falls back to rule-based on any Gemini failure
    const { results: screeningData, scoringMode } = await screenApplicants(jobArg, talsArg);

    // Cap at shortlistTarget
    const shortlisted = screeningData.slice(0, job.shortlistTarget);

    // Replace old results for this job
    await ScreeningResult.deleteMany({ jobId });
    await ScreeningResult.insertMany(shortlisted);

    // Mark job completed
    await Job.findByIdAndUpdate(jobId, { status: 'completed' });

    // Return populated results so the UI can display name/role immediately
    const populated = await ScreeningResult.find({ jobId })
      .sort({ rank: 1 })
      .populate('talentId', 'name firstName lastName email phone skills experienceYears currentRole location education source headline')
      .lean();

    const shaped = populated.map((r: any) => ({
      ...r,
      _id:      r._id.toString(),
      jobId:    r.jobId.toString(),
      talent:   r.talentId,
      talentId: (r.talentId as any)?._id?.toString() ?? r.talentId?.toString(),
    }));

    return NextResponse.json({
      results:     shaped,
      jobId,
      total:       applicants.length,
      shortlisted: shaped.length,
      scoringMode,
    });
  } catch (err: any) {
    // Only DB / infrastructure errors reach here (screenApplicants handles its own errors)
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { status: 'active' }).catch(() => {});
    }
    console.error('[UmuravaHire] Screening route error:', err?.message ?? err);
    return NextResponse.json({ message: err.message || 'Screening failed' }, { status: 500 });
  }
}
