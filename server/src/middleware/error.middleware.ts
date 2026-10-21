import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
    statusCode: 404,
  });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  // Handle Mongoose / MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keyPattern = err.keyPattern ? Object.keys(err.keyPattern) : [];
    const keyValue = err.keyValue || {};
    const field = keyPattern[0] || Object.keys(keyValue)[0] || 'record';

    if (env.NODE_ENV !== 'test') {
      console.error(
        `[Database Conflict 11000] Duplicate key on field '${field}'. Values:`,
        keyValue
      );
    }

    if (field === 'sessionTokenHash' || field.includes('session') || field === '_id') {
      message = 'A temporary session conflict occurred. Please refresh the page and try signing in again.';
      errors = [{ field: 'session', message }];
    } else if (field === 'email') {
      message = 'An account with this email address already exists.';
      errors = [{ field: 'email', message }];
    } else if (field === 'username') {
      message = 'This username is already taken. Please choose another username.';
      errors = [{ field: 'username', message }];
    } else if (field === 'googleId') {
      message = 'This Google account is already linked to a TemariHub profile.';
      errors = [{ field: 'googleId', message }];
    } else if (field === 'slug') {
      message = 'An opportunity with this URL title slug already exists.';
      errors = [{ field: 'slug', message }];
    } else {
      message = `An account or record with this ${field} already exists.`;
      errors = [{ field, message }];
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation error';
    errors = Object.values(err.errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for identifier: ${err.value}`;
  }

  // Handle Multer upload errors (size limit, file counts)
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image file exceeds the 5 MB maximum size limit.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  if (statusCode === 500 && env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    statusCode,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
