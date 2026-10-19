import mongoose, { Document, Schema, Types } from 'mongoose';

export type DegreeLevel =
  | 'undergraduate'
  | 'postgraduate'
  | 'phd'
  | 'tvet'
  | 'recent_graduate';

export type WorkArrangement = 'on_site' | 'remote' | 'hybrid';

export interface IStudentProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  university: string;
  customUniversity?: string;
  degreeLevel: DegreeLevel;
  fieldOfStudy: string;
  graduationYear?: number;
  skills: string[];
  preferredLocations: string[];
  preferredArrangements: WorkArrangement[];
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true,
    },
    customUniversity: {
      type: String,
      trim: true,
    },
    degreeLevel: {
      type: String,
      enum: ['undergraduate', 'postgraduate', 'phd', 'tvet', 'recent_graduate'],
      required: [true, 'Degree level is required'],
      default: 'undergraduate',
    },
    fieldOfStudy: {
      type: String,
      required: [true, 'Field of study is required'],
      trim: true,
    },
    graduationYear: {
      type: Number,
      min: 2020,
      max: 2040,
    },
    skills: {
      type: [String],
      default: [],
    },
    preferredLocations: {
      type: [String],
      default: [],
    },
    preferredArrangements: {
      type: [String],
      enum: ['on_site', 'remote', 'hybrid'],
      default: [],
    },
    bio: {
      type: String,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

StudentProfileSchema.index({ university: 1 });
StudentProfileSchema.index({ fieldOfStudy: 1 });

export const StudentProfile = mongoose.model<IStudentProfile>(
  'StudentProfile',
  StudentProfileSchema
);
