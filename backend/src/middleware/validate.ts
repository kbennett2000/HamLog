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
