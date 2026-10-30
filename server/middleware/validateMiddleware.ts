import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query) as any;
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params) as any;
      }
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      next(err);
    }
  };
};
