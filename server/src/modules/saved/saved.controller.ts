import { Request, Response, NextFunction } from 'express';
import { SavedService } from './saved.service.js';

export class SavedController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await SavedService.getSavedOpportunities(req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  static async save(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { opportunityId } = req.params;
      const result = await SavedService.saveOpportunity(req.user!._id.toString(), opportunityId);
      res.status(200).json({
        success: true,
        message: 'Opportunity bookmarked successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unsave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { opportunityId } = req.params;
      const result = await SavedService.removeSavedOpportunity(req.user!._id.toString(), opportunityId);
      res.status(200).json({
        success: true,
        message: 'Opportunity bookmark removed.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkIsSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { opportunityId } = req.params;
      const isSaved = await SavedService.isSaved(req.user!._id.toString(), opportunityId);
      res.status(200).json({
        success: true,
        data: { isSaved },
      });
    } catch (err) {
      next(err);
    }
  }
}
