import mongoose, { Document, Model } from 'mongoose';

export interface IJob extends Document {
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  location: string;
  experienceYears: number;
  educationRequired?: string;
  shortlistTarget: 10 | 20;
  status: 'active' | 'screening' | 'completed';
  applicantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new mongoose.Schema<IJob>(
  {
    title:            { type: String, required: true, trim: true },
    department:       { type: String, required: true, trim: true },
    description:      { type: String, default: '' },
    requiredSkills:   { type: [String], required: true },
    niceToHaveSkills: { type: [String], default: [] },
    location:         { type: String, default: 'Remote' },
    experienceYears:  { type: Number, required: true, min: 0 },
    educationRequired:{ type: String, default: 'Any' },
    shortlistTarget:  { type: Number, enum: [10, 20], default: 10 },
    status:           { type: String, enum: ['active', 'screening', 'completed'], default: 'active' },
    applicantCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Job: Model<IJob> =
  (mongoose.models.Job as Model<IJob>) || mongoose.model<IJob>('Job', jobSchema);
export default Job;
