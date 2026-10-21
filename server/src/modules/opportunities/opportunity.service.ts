import mongoose, { FilterQuery } from 'mongoose';
import { Opportunity, IOpportunity } from '../../models/Opportunity.js';
import { OpportunityReport } from '../../models/OpportunityReport.js';
import { IUser } from '../../models/User.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base || 'opp'}-${randomSuffix}`;
}

export interface ListOpportunitiesParams {
  search?: string;
  type?: string | string[];
  types?: string | string[];
  workArrangement?: string | string[];
  arrangements?: string | string[];
  level?: string | string[];
  levels?: string | string[];
  field?: string;
  location?: string;
  locationScope?: 'ethiopia' | 'remote' | 'international' | string;
  includeExpired?: boolean;
  sort?: 'newest' | 'deadline_asc' | 'deadline_desc';
  sortBy?: 'newest' | 'deadline_asc' | 'deadline_desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export class OpportunityService {
  /**
   * Lists published & approved opportunities with filtering, search, sorting, and pagination.
   * STRICT SECURITY INVARIANT: Pending, rejected, draft, and archived opportunities
   * are NEVER exposed via this public endpoint.
   */
  static async listOpportunities(params: ListOpportunitiesParams): Promise<PaginatedResult<IOpportunity>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 12;
    const skip = (page - 1) * limit;

    const query: FilterQuery<IOpportunity> = {
      moderationStatus: 'approved',
      verificationStatus: 'VERIFIED',
    };

    // Expired listings filter
    if (params.includeExpired) {
      query.publicationStatus = { $in: ['published', 'expired'] };
    } else {
      query.publicationStatus = 'published';
      query.$and = [
        {
          $or: [
            { isRollingDeadline: true },
            { deadline: { $gte: new Date() } },
          ],
        },
      ];
    }

    // 1. Full-text / Multi-field Search
    if (params.search && params.search.trim() !== '') {
      const escaped = escapeRegex(params.search.trim());
      const searchRegex = new RegExp(escaped, 'i');

      const searchConditions = [
        { title: searchRegex },
        { 'organization.name': searchRegex },
        { description: searchRegex },
        { requiredSkills: searchRegex },
        { location: searchRegex },
      ];

      if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    // 2. Opportunity Type filter
    const rawTypes = params.types || params.type;
    if (rawTypes) {
      const typeList = Array.isArray(rawTypes)
        ? rawTypes
        : rawTypes.split(',').map((t) => t.trim()).filter(Boolean);
      if (typeList.length > 0) {
        query.opportunityType = { $in: typeList };
      }
    }

    // 3. Work Arrangement filter
    const rawArrangements = params.arrangements || params.workArrangement;
    if (rawArrangements) {
      const arrList = Array.isArray(rawArrangements)
        ? rawArrangements
        : rawArrangements.split(',').map((a) => a.trim()).filter(Boolean);
      if (arrList.length > 0) {
        query.workArrangement = { $in: arrList };
      }
    }

    // 4. Eligible Degree Level filter
    const rawLevels = params.levels || params.level;
    if (rawLevels) {
      const levelList = Array.isArray(rawLevels)
        ? rawLevels
        : rawLevels.split(',').map((l) => l.trim()).filter(Boolean);
      if (levelList.length > 0) {
        query.eligibleLevels = { $in: levelList };
      }
    }

    // 5. STEM Field of Study filter
    if (params.field && params.field !== 'All Fields' && params.field.trim() !== '') {
      query.eligibleFields = { $in: [params.field, 'All STEM Disciplines'] };
    }

    // 6. Location filter
    if (params.location && params.location !== 'All Locations' && params.location.trim() !== '') {
      query.location = new RegExp(escapeRegex(params.location.trim()), 'i');
    }

    // 6b. Location Scope filter (ethiopia, remote, international)
    if (params.locationScope === 'remote') {
      query.workArrangement = 'remote';
    } else if (params.locationScope === 'ethiopia') {
      query.location = /ethiopia|addis|adama|hawassa|dire dawa|bahir dar|mekelle|gondar/i;
    } else if (params.locationScope === 'international') {
      query.location = /international|global|worldwide|germany|usa|online|hybrid\/regional/i;
    }

    // 7. Sort order
    const sortField = params.sortBy || params.sort || 'newest';
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortField === 'deadline_asc') {
      sortOptions = { deadline: 1, createdAt: -1 };
    } else if (sortField === 'deadline_desc') {
      sortOptions = { deadline: -1, createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      Opportunity.find(query).sort(sortOptions).skip(skip).limit(limit),
      Opportunity.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      totalPages,
      limit,
    };
  }

  /**
   * Retrieves an opportunity by ObjectId or unique slug.
   * Enforces privacy: unapproved / draft opportunities are only accessible
   * to their submitter or an administrator.
   */
  static async getOpportunityByIdOrSlug(
    idOrSlug: string,
    currentUser?: IUser
  ): Promise<IOpportunity> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const opportunity = await Opportunity.findOne(filter);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const isPubliclyVisible =
      opportunity.moderationStatus === 'approved' &&
      opportunity.verificationStatus === 'VERIFIED' &&
      (opportunity.publicationStatus === 'published' || opportunity.publicationStatus === 'expired');

    if (!isPubliclyVisible) {
      const isOwner = currentUser && opportunity.submittedBy.toString() === currentUser._id.toString();
      const isAdmin = currentUser?.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new NotFoundError('Opportunity not found or not published');
      }
    }

    // Increment view counter asynchronously without blocking response
    Opportunity.updateOne({ _id: opportunity._id }, { $inc: { viewsCount: 1 } }).exec();

    return opportunity;
  }

  /**
   * Submits a new opportunity listing.
   * Non-admin submissions always enter the moderation queue as 'pending' + 'draft'.
   */
  static async submitOpportunity(
    data: any,
    user: IUser
  ): Promise<IOpportunity> {
    const slug = generateSlug(data.title);
    const deadlineDate = new Date(data.deadline);

    if (isNaN(deadlineDate.getTime())) {
      throw new BadRequestError('Invalid deadline date format');
    }

    const isAdmin = user.role === 'admin';
    const moderationStatus = isAdmin ? 'approved' : 'pending';
    const publicationStatus = isAdmin ? 'published' : 'draft';

    const opportunity = await Opportunity.create({
      ...data,
      slug,
      deadline: deadlineDate,
      submittedBy: user._id,
      moderationStatus,
      publicationStatus,
      reviewedBy: isAdmin ? user._id : undefined,
      publicationDate: isAdmin ? new Date() : undefined,
      lastVerifiedDate: new Date(),
    });

    return opportunity;
  }

  /**
   * Returns listings submitted by the current user.
   */
  static async getMySubmissions(user: IUser): Promise<IOpportunity[]> {
    return Opportunity.find({ submittedBy: user._id }).sort({ createdAt: -1 });
  }

  /**
   * Allows an authenticated user to report an opportunity for moderation review.
   */
  static async reportOpportunity(
    opportunityId: string,
    reportData: { reason: string; details: string },
    user: IUser
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const report = await OpportunityReport.create({
      opportunityId: opportunity._id,
      reportedBy: user._id,
      reason: reportData.reason,
      details: reportData.details,
      status: 'pending',
    });

    await Opportunity.updateOne({ _id: opportunity._id }, { $inc: { reportCount: 1 } });

    return report;
  }

  /**
   * Updates an existing submitted opportunity by its author or an administrator.
   * If a verified opportunity is materially updated, re-verification is required.
   */
  static async updateSubmission(
    id: string,
    data: any,
    user: IUser
  ): Promise<IOpportunity> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid opportunity ID');
    }

    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const isOwner = opportunity.submittedBy.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new BadRequestError('You do not have permission to edit this submission');
    }

    const now = new Date();
    const isMaterialEdit =
      (data.deadline && new Date(data.deadline).toISOString() !== opportunity.deadline.toISOString()) ||
      (data.applicationUrl && data.applicationUrl !== opportunity.applicationUrl) ||
      (data.originalSourceUrl && data.originalSourceUrl !== opportunity.originalSourceUrl) ||
      (data.title && data.title !== opportunity.title) ||
      (data.description && data.description !== opportunity.description);

    // If submitter edits or material update occurs, reset to PENDING_REVIEW & draft
    if (!isAdmin || isMaterialEdit) {
      if (opportunity.verificationStatus === 'VERIFIED') {
        opportunity.changeHistory.push({
          date: now,
          fieldChanged: 'content_updated',
          oldValue: 'VERIFIED',
          newValue: 'PENDING_REVIEW',
          reason: 'Material changes submitted by author requiring re-verification',
        });
      }
      opportunity.isMateriallyUpdated = true;
      opportunity.verificationStatus = 'PENDING_REVIEW';
      opportunity.moderationStatus = 'pending';
      opportunity.publicationStatus = 'draft';
    }

    if (data.title) opportunity.title = data.title;
    if (data.opportunityType) opportunity.opportunityType = data.opportunityType;
    if (data.description) opportunity.description = data.description;
    if (data.eligibleFields) opportunity.eligibleFields = data.eligibleFields;
    if (data.eligibleLevels) opportunity.eligibleLevels = data.eligibleLevels;
    if (data.requiredSkills) opportunity.requiredSkills = data.requiredSkills;
    if (data.location) opportunity.location = data.location;
    if (data.workArrangement) opportunity.workArrangement = data.workArrangement;
    if (data.deadline) {
      const d = new Date(data.deadline);
      if (!isNaN(d.getTime())) opportunity.deadline = d;
    }
    if (typeof data.isRollingDeadline === 'boolean') opportunity.isRollingDeadline = data.isRollingDeadline;
    if (data.compensation) opportunity.compensation = { ...opportunity.compensation, ...data.compensation };
    if (data.originalSourceUrl) opportunity.originalSourceUrl = data.originalSourceUrl;
    if (data.applicationUrl) opportunity.applicationUrl = data.applicationUrl;
    if (data.sourceNotes) opportunity.sourceNotes = data.sourceNotes;
    if (data.organization?.name) opportunity.organization.name = data.organization.name;
    if (data.organization?.websiteUrl) opportunity.organization.websiteUrl = data.organization.websiteUrl;

    await opportunity.save();
    return opportunity;
  }
}
