import { NextFunction, Request, Response } from 'express';
import { Schema } from 'joi';
import { StatusCodes } from '@/shared/constants/http-status.constants';

export const validate =
  (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: errorMessages });
    }

    return next();
  };
