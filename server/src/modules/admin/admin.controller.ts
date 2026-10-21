import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import {
  moderationDecisionSchema,
  verificationDecisionSchema,
  resolveReportSchema,
} from './admin.schema.js';
import { BadRequestError } from '../../utils/errors.js';

export class AdminController {
  static async getQueue(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await AdminService.getModerationQueue();
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getVerificationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statusFilter = req.query.status as string | undefined;
      const items = await AdminService.getVerificationQueue(statusFilter);
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  static async decideVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = verificationDecisionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for verification decision', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const updated = await AdminService.decideVerification(
        id,
        parsed.data.status,
        parsed.data.evidenceNotes,
        req.user!
      );

      res.status(200).json({
        success: true,
        message: `Opportunity verification status set to ${parsed.data.status}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getChangeHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const history = await AdminService.getMaterialChangeHistory(limit);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }

  static async decideModeration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = moderationDecisionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for moderation decision', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const updated = await AdminService.decideModeration(
        id,
        parsed.data.decision,
        parsed.data.reviewNotes,
        req.user!
      );

      res.status(200).json({
        success: true,
        message: `Opportunity ${parsed.data.decision}d successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statusFilter = req.query.status as string | undefined;
      const reports = await AdminService.getReports(statusFilter);
      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = resolveReportSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for report resolution', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const updated = await AdminService.resolveReport(
        id,
        parsed.data.status,
        parsed.data.resolutionNotes,
        req.user!
      );

      res.status(200).json({
        success: true,
        message: 'Report resolved successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const logs = await AdminService.getAuditLogs(limit);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getPlatformStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
