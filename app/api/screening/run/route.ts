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

    const jobArg   = { ...job, _id: job._id.toString() } as unknown as JobType;
    const talsArg  = applicants.map((a) => ({
      ...a,
      _id:   a._id.toString(),
      jobId: a.jobId.toString(),
    })) as unknown as TalentType[];

    const screeningData = await screenApplicants(jobArg, talsArg);

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
      results:    shaped,
      jobId,
      total:      applicants.length,
      shortlisted: shaped.length,
      scoringMode: 'ai',
    });
  } catch (err: any) {
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { status: 'active' }).catch(() => {});
    }
    const msg = err.message || 'Screening failed';
    const lower = msg.toLowerCase();
    const isQuota =
      lower.includes('429') ||
      lower.includes('quota') ||
      lower.includes('too many') ||
      lower.includes('resource_exhausted') ||
      lower.includes('resource has been exhausted') ||
      err?.status === 429;
    const userMsg = isQuota
      ? `Gemini API quota exceeded. Please wait a few minutes and try again, or check your API usage at ai.google.dev. (Raw: ${msg})`
      : msg;
    return NextResponse.json({ message: userMsg }, { status: isQuota ? 429 : 500 });
  }
}
