import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'student' | 'submitter' | 'admin';
export type AuthProviderType = 'local' | 'google';

export interface IUserPreferences {
  deadlineAlerts: boolean;
  reviewAlerts: boolean;
  language: 'en' | 'am';
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  authProvider: AuthProviderType;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  customAvatarUrl?: string;
  googleAvatarUrl?: string;
  hasCustomAvatar?: boolean;
  preferences?: IUserPreferences;
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
      required: function (this: IUser) {
        return !this.googleId && this.authProvider === 'local';
      },
      select: false, // Never return password hash in queries by default
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
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
      default: '',
    },
    customAvatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    googleAvatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    hasCustomAvatar: {
      type: Boolean,
      default: false,
    },
    preferences: {
      deadlineAlerts: {
        type: Boolean,
        default: true,
      },
      reviewAlerts: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        enum: ['en', 'am'],
        default: 'en',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        (ret as any).id = ret._id.toString();
        (ret as any).fullName = ret.name;
        (ret as any).customAvatarUrl = ret.customAvatarUrl || '';
        (ret as any).avatarUrl = ret.avatarUrl || ret.googleAvatarUrl || '';
        (ret as any).hasCustomAvatar = Boolean(ret.hasCustomAvatar);
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
