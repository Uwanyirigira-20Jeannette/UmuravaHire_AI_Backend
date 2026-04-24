import mongoose, { Document, Model } from 'mongoose';

export interface IScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  relevance: number;
}

export interface IScreeningResult extends Document {
  jobId: mongoose.Types.ObjectId;
  talentId: mongoose.Types.ObjectId;
  rank: number;
  matchScore: number;
  scoreBreakdown: IScoreBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  hiringSuggestion: 'Strong Yes' | 'Yes' | 'Maybe' | 'No';
  createdAt: Date;
}

const screeningSchema = new mongoose.Schema<IScreeningResult>(
  {
    jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job',          required: true, index: true },
    talentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true },
    rank:     { type: Number, required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    scoreBreakdown: {
      skills:     { type: Number, required: true },
      experience: { type: Number, required: true },
      education:  { type: Number, required: true },
      relevance:  { type: Number, required: true },
    },
    strengths:        { type: [String], default: [] },
    gaps:             { type: [String], default: [] },
    recommendation:   { type: String, default: '' },
    hiringSuggestion: { type: String, enum: ['Strong Yes', 'Yes', 'Maybe', 'No'], required: true },
  },
  { timestamps: true }
);

const ScreeningResult: Model<IScreeningResult> =
  (mongoose.models.ScreeningResult as Model<IScreeningResult>) ||
  mongoose.model<IScreeningResult>('ScreeningResult', screeningSchema);
export default ScreeningResult;
