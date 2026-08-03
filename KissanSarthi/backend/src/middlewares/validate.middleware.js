import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, formattedErrors));
  }
  next();
};
