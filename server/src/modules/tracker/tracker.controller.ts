import { Request, Response, NextFunction } from 'express';
import { TrackerService } from './tracker.service.js';
import { createTrackerSchema, updateTrackerSchema } from './tracker.schema.js';
import { BadRequestError } from '../../utils/errors.js';

export class TrackerController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await TrackerService.getTrackerItems(req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  static async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await TrackerService.getTrackerStats(req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createTrackerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for tracker item', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const item = await TrackerService.addToTracker(req.user!._id.toString(), parsed.data);
      res.status(201).json({
        success: true,
        message: 'Opportunity added to application tracker.',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackerId } = req.params;
      const parsed = updateTrackerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Validation failed for tracker update', parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })));
      }

      const item = await TrackerService.updateTrackerItem(
        trackerId,
        req.user!._id.toString(),
        parsed.data
      );

      res.status(200).json({
        success: true,
        message: 'Tracker entry updated successfully.',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackerId } = req.params;
      await TrackerService.deleteTrackerItem(trackerId, req.user!._id.toString());
      res.status(200).json({
        success: true,
        message: 'Tracker entry deleted.',
      });
    } catch (err) {
      next(err);
    }
  }
}
