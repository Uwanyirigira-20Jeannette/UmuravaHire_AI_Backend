import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ScreeningResult from '@/models/ScreeningResult';

// GET /api/screening/shortlist/[jobId]
export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    await connectDB();
    const results = await ScreeningResult.find({ jobId: params.jobId })
      .sort({ rank: 1 })
      .populate('talentId', 'name email phone skills experienceYears currentRole location education summary source')
      .lean();

    // Rename populated field for frontend convenience
    const shaped = results.map((r) => ({
      ...r,
      _id:     r._id.toString(),
      jobId:   r.jobId.toString(),
      talent:  r.talentId,        // populated TalentProfile
      talentId: (r.talentId as any)?._id?.toString() ?? r.talentId?.toString(),
    }));

    return NextResponse.json(shaped);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
