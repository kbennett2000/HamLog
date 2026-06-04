import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues ?? [];
        res.status(400).json({
          error: 'Validation failed',
          details: issues.map((e) => ({
            field: String(e.path?.join('.') ?? ''),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}

// Like validate(), but for req.query. It validates for rejection only and does NOT
// reassign req.query (which is a read-only getter in newer Express); the handler keeps
// reading the now-known-valid req.query. Returns the same 400 shape as validate().
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues ?? [];
        res.status(400).json({
          error: 'Validation failed',
          details: issues.map((e) => ({
            field: String(e.path?.join('.') ?? ''),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
