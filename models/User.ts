import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  provider: 'credentials' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },           // undefined for Google-only accounts
    avatar:       { type: String },
    provider:     { type: String, enum: ['credentials', 'google'], default: 'credentials' },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
export default User;
