import { Request, Response, NextFunction } from 'express';
import { TrustedSource } from '../../models/TrustedSource.js';
import { SourceMonitorService } from './sourceMonitor.service.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { z } from 'zod';

const createSourceSchema = z.object({
  name: z.string().min(2).max(150),
  officialUrl: z.string().url(),
  category: z.enum([
    'university',
    'corporate',
    'government',
    'international_org',
    'scholarship_portal',
    'tech_community',
  ]),
  monitoringMethod: z.enum([
    'official_api',
    'rss_feed',
    'permitted_monitoring',
    'manual_review',
  ]),
  notes: z.string().max(2000).optional(),
});

const updateSourceSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  officialUrl: z.string().url().optional(),
  category: z
    .enum([
      'university',
      'corporate',
      'government',
      'international_org',
      'scholarship_portal',
      'tech_community',
    ])
    .optional(),
  verificationStatus: z.enum(['approved', 'pending_review', 'disabled']).optional(),
  monitoringMethod: z
    .enum(['official_api', 'rss_feed', 'permitted_monitoring', 'manual_review'])
    .optional(),
  notes: z.string().max(2000).optional(),
});

export class SourceController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const status = req.query.status as string | undefined;

      const filter: any = {};
      if (category) filter.category = category;
      if (status) filter.verificationStatus = status;

      const sources = await TrustedSource.find(filter)
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: sources,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for trusted source', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const slug = parsed.data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const existing = await TrustedSource.findOne({ slug });
      if (existing) {
        throw new BadRequestError(`A source with identifier '${slug}' already exists.`);
      }

      const source = await TrustedSource.create({
        ...parsed.data,
        slug,
        verificationStatus: 'approved',
        monitoringStatus: parsed.data.monitoringMethod === 'manual_review' ? 'healthy' : 'idle',
        approvedBy: req.user!._id,
      });

      res.status(201).json({
        success: true,
        message: 'Trusted source successfully registered.',
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = updateSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for updating source', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const source = await TrustedSource.findById(id);
      if (!source) {
        throw new NotFoundError('Trusted source not found');
      }

      Object.assign(source, parsed.data);
      await source.save();

      res.status(200).json({
        success: true,
        message: 'Trusted source updated successfully.',
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SourceMonitorService.checkSource(id);

      res.status(200).json({
        success: true,
        message: `Source check completed: ${result.newDiscovered} new discovered, ${result.updated} updated.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SourceMonitorService.checkAllSources();

      res.status(200).json({
        success: true,
        message: `Batch monitoring run finished: Checked ${result.sourcesChecked} sources.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalSources, healthySources, failingSources, totalDiscovered] = await Promise.all([
        TrustedSource.countDocuments(),
        TrustedSource.countDocuments({ monitoringStatus: 'healthy' }),
        TrustedSource.countDocuments({ monitoringStatus: 'failing' }),
        TrustedSource.aggregate([
          { $group: { _id: null, total: { $sum: '$opportunitiesDiscoveredCount' } } },
        ]),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalSources,
          healthySources,
          failingSources,
          totalOpportunitiesDiscovered: totalDiscovered[0]?.total || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
