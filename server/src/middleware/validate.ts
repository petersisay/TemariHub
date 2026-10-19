import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors.js';

interface RequestValidators {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemaOrValidators: ZodTypeAny | RequestValidators) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schemaOrValidators) {
        req.body = await schemaOrValidators.parseAsync(req.body);
      } else {
        if (schemaOrValidators.params) {
          req.params = await schemaOrValidators.params.parseAsync(req.params);
        }
        if (schemaOrValidators.query) {
          req.query = await schemaOrValidators.query.parseAsync(req.query);
        }
        if (schemaOrValidators.body) {
          req.body = await schemaOrValidators.body.parseAsync(req.body);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new BadRequestError('Validation failed for provided input', errorDetails));
      } else {
        next(error);
      }
    }
  };
}
