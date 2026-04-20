import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

export const validate =
  (schema: ZodSchema, target: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[target]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = (err as ZodError).issues.map((e: ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }
      next(err);
    }
  };
