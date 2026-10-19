import { User, IUser } from '../../models/User.js';
import { StudentProfile } from '../../models/StudentProfile.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';
import { RegisterInput, LoginInput } from './auth.validation.js';

export class AuthService {
  async register(input: RegisterInput): Promise<IUser> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isVerified: false,
    });

    // If registering as a student, initialize their academic profile container
    if (user.role === 'student') {
      await StudentProfile.create({
        userId: user._id,
        university: 'ASTU (Adama Science and Technology University)',
        degreeLevel: 'undergraduate',
        fieldOfStudy: 'General STEM / Undeclared',
        skills: [],
        preferredLocations: [],
        preferredArrangements: [],
      });
    }

    return user;
  }

  async login(input: LoginInput): Promise<IUser> {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    return user;
  }

  async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    return user;
  }
}

export const authService = new AuthService();
