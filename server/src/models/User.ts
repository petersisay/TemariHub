import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'student' | 'submitter' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password hash in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'submitter', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'student',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        (ret as any).id = ret._id.toString();
        (ret as any).fullName = ret.name;
        delete (ret as any).passwordHash;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

UserSchema.virtual('fullName').get(function () {
  return this.name;
});


UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
