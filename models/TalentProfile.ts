import mongoose, { Document, Model } from 'mongoose';

/* ── Sub-document interfaces ─────────────────────────────────────── */

export interface ISkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience?: number;
}

export interface ILanguage {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface IWorkExperience {
  company: string;
  role: string;
  startDate: string;      // YYYY-MM
  endDate?: string;       // YYYY-MM  or  "Present"
  description?: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear?: number;
  endYear?: number;
}

export interface ICertification {
  name: string;
  issuer?: string;
  issueDate?: string;     // YYYY-MM
}

export interface IProject {
  name: string;
  description?: string;
  technologies: string[];
  role?: string;
  link?: string;
  startDate?: string;     // YYYY-MM
  endDate?: string;       // YYYY-MM
}

export interface IAvailability {
  status: 'Available' | 'Open to Opportunities' | 'Not Available';
  type?: 'Full-time' | 'Part-time' | 'Contract';
  startDate?: string;     // YYYY-MM-DD
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  website?: string;
}

/* ── Main interface ──────────────────────────────────────────────── */

export interface ITalentProfile extends Document {
  jobId: mongoose.Types.ObjectId;

  // 3.1 Basic information
  firstName: string;
  lastName:  string;   // optional — single-name candidates and PDF uploads may omit it
  name:      string;          // firstName + ' ' + lastName (set by pre-save hook)
  email:     string;
  phone?:    string;
  headline:  string;          // e.g. "Backend Engineer – Node.js & AI Systems"
  bio?:      string;
  location:  string;

  // 3.2 Skills & languages
  skills:     ISkill[];
  languages?: ILanguage[];

  // 3.3 Work experience
  experience:      IWorkExperience[];
  experienceYears: number;    // total years (convenience for AI scoring)
  currentRole?:    string;    // derived from the most recent experience entry

  // 3.4 Education
  education: IEducation[];

  // 3.5 Certifications
  certifications?: ICertification[];

  // 3.6 Projects
  projects: IProject[];

  // 3.7 Availability
  availability?: IAvailability;

  // 3.8 Social links
  socialLinks?: ISocialLinks;

  // Meta
  source:   'csv' | 'pdf' | 'umurava' | 'manual';
  summary?: string;           // legacy alias kept for backwards-compat

  createdAt: Date;
  updatedAt: Date;
}

/* ── Sub-document schemas ────────────────────────────────────────── */

const skillSchema = new mongoose.Schema<ISkill>(
  {
    name:               { type: String, required: true, trim: true },
    level:              { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
    yearsOfExperience:  { type: Number, min: 0 },
  },
  { _id: false }
);

const languageSchema = new mongoose.Schema<ILanguage>(
  {
    name:        { type: String, required: true, trim: true },
    proficiency: { type: String, enum: ['Basic', 'Conversational', 'Fluent', 'Native'], default: 'Conversational' },
  },
  { _id: false }
);

const workExperienceSchema = new mongoose.Schema<IWorkExperience>(
  {
    company:      { type: String, default: 'Unknown', trim: true },
    role:         { type: String, default: 'Unknown', trim: true },
    startDate:    { type: String, default: '' },
    endDate:      { type: String },
    description:  { type: String },
    technologies: { type: [String], default: [] },
    isCurrent:    { type: Boolean, default: false },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema<IEducation>(
  {
    institution: { type: String, default: '', trim: true },
    degree:      { type: String, default: '', trim: true },
    fieldOfStudy:{ type: String, default: '', trim: true },
    startYear:   { type: Number },
    endYear:     { type: Number },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema<ICertification>(
  {
    name:      { type: String, required: true, trim: true },
    issuer:    { type: String, trim: true },
    issueDate: { type: String },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema<IProject>(
  {
    name:         { type: String, required: true, trim: true },
    description:  { type: String },
    technologies: { type: [String], default: [] },
    role:         { type: String },
    link:         { type: String },
    startDate:    { type: String },
    endDate:      { type: String },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema<IAvailability>(
  {
    status:    { type: String, enum: ['Available', 'Open to Opportunities', 'Not Available'], default: 'Available' },
    type:      { type: String, enum: ['Full-time', 'Part-time', 'Contract'] },
    startDate: { type: String },
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema<ISocialLinks>(
  {
    linkedin:  { type: String },
    github:    { type: String },
    portfolio: { type: String },
    twitter:   { type: String },
    website:   { type: String },
  },
  { _id: false }
);

/* ── Main schema ─────────────────────────────────────────────────── */

const talentSchema = new mongoose.Schema<ITalentProfile>(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },

    // 3.1 Basic
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, trim: true, default: '' },
    name:      { type: String, trim: true },          // auto-filled by pre-save
    email:     { type: String, default: '', lowercase: true, trim: true },
    phone:     { type: String },
    headline:  { type: String, required: true, trim: true, default: 'Talent' },
    bio:       { type: String },
    location:  { type: String, required: true, trim: true, default: 'Not specified' },

    // 3.2 Skills & languages
    skills:    { type: [skillSchema],    default: [] },
    languages: { type: [languageSchema], default: [] },

    // 3.3 Work experience
    experience:      { type: [workExperienceSchema], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    currentRole:     { type: String },

    // 3.4 Education
    education: { type: [educationSchema], default: [] },

    // 3.5 Certifications
    certifications: { type: [certificationSchema], default: [] },

    // 3.6 Projects
    projects: { type: [projectSchema], default: [] },

    // 3.7 Availability
    availability: { type: availabilitySchema },

    // 3.8 Social links
    socialLinks: { type: socialLinksSchema },

    // Meta
    source:  { type: String, enum: ['csv', 'pdf', 'umurava', 'manual'], required: true },
    summary: { type: String },   // legacy
  },
  { timestamps: true }
);

/* ── Pre-save: compute name and currentRole ──────────────────────── */

talentSchema.pre('save', function (next) {
  this.name = `${this.firstName} ${this.lastName}`.trim();

  // Derive currentRole from experience if not explicitly set
  if (!this.currentRole && this.experience?.length) {
    const current = this.experience.find((e) => e.isCurrent) ?? this.experience[0];
    if (current) this.currentRole = current.role;
  }
  next();
});

/* ── Pre-insertMany hook (also fires for insertMany) ─────────────── */

talentSchema.pre('insertMany', function (_next, docs: any[]) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (!doc.name) {
        doc.name = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
      }
      if (!doc.currentRole && doc.experience?.length) {
        const cur = doc.experience.find((e: any) => e.isCurrent) ?? doc.experience[0];
        if (cur) doc.currentRole = cur.role;
      }
    });
  }
  _next();
});

/* ── Model ───────────────────────────────────────────────────────── */

const TalentProfile: Model<ITalentProfile> =
  (mongoose.models.TalentProfile as Model<ITalentProfile>) ||
  mongoose.model<ITalentProfile>('TalentProfile', talentSchema);

export default TalentProfile;
