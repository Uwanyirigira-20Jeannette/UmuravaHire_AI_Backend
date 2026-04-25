export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TalentProfile from '@/models/TalentProfile';

// GET /api/applicants?jobId=xxx&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    if (!jobId) return NextResponse.json({ message: 'jobId query param is required' }, { status: 400 });

    const [applicants, total] = await Promise.all([
      TalentProfile.find({ jobId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TalentProfile.countDocuments({ jobId }),
    ]);

    return NextResponse.json({ applicants, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
