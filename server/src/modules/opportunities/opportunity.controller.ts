import { Request, Response, NextFunction } from 'express';
import { OpportunityService } from './opportunity.service.js';
import {
  listOpportunitiesQuerySchema,
  submitOpportunitySchema,
  updateOpportunitySchema,
  reportOpportunitySchema,
} from './opportunity.schema.js';
import { BadRequestError } from '../../utils/errors.js';

export class OpportunityController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = listOpportunitiesQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw new BadRequestError('Invalid query parameters', parsedQuery.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const result = await OpportunityService.listOpportunities(parsedQuery.data);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idOrSlug } = req.params;
      const opportunity = await OpportunityService.getOpportunityByIdOrSlug(idOrSlug, req.user);

      res.status(200).json({
        success: true,
        data: opportunity,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = submitOpportunitySchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new BadRequestError('Validation failed for submitted opportunity', parsedBody.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const opportunity = await OpportunityService.submitOpportunity(parsedBody.data, req.user!);

      res.status(201).json({
        success: true,
        message: req.user!.role === 'admin'
          ? 'Opportunity successfully created and published.'
          : 'Opportunity submitted successfully. It is now pending administrator review.',
        data: opportunity,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMySubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissions = await OpportunityService.getMySubmissions(req.user!);

      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (err) {
      next(err);
    }
  }

  static async report(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsedBody = reportOpportunitySchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new BadRequestError('Validation failed for report', parsedBody.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const report = await OpportunityService.reportOpportunity(id, parsedBody.data, req.user!);

      res.status(201).json({
        success: true,
        message: 'Thank you for your report. Our moderation team will investigate.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMySubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsedBody = updateOpportunitySchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new BadRequestError('Validation failed for opportunity update', parsedBody.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const updated = await OpportunityService.updateSubmission(id, parsedBody.data, req.user!);

      res.status(200).json({
        success: true,
        message: 'Submission updated successfully. It has been queued for re-verification.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
