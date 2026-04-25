export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';
import ScreeningResult from '@/models/ScreeningResult';

export async function GET() {
  try {
    await connectDB();
    const [
      totalJobs,
      totalApplicants,
      screened,
      shortlisted,
      byStatus,
      recentJobs,
      byDepartment,
    ] = await Promise.all([
      Job.countDocuments(),
      TalentProfile.countDocuments(),
      ScreeningResult.distinct('jobId').then((ids) => ids.length),
      ScreeningResult.countDocuments(),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Job.find().sort({ createdAt: -1 }).limit(5).lean(),
      // department breakdown: jobs + applicant totals per dept
      Job.aggregate([
        {
          $group: {
            _id:        '$department',
            count:      { $sum: 1 },
            applicants: { $sum: '$applicantCount' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const activeJobs    = byStatus.find((s: any) => s._id === 'active')?.count    || 0;
    const completedJobs = byStatus.find((s: any) => s._id === 'completed')?.count || 0;

    return NextResponse.json({
      totalJobs,
      activeJobs,
      completedJobs,
      totalApplicants,
      screened,
      shortlisted,
      recentJobs,
      byDepartment,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
