import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, HTTP_STATUS.BAD_REQUEST);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists`, HTTP_STATUS.CONFLICT);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  return new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors);
};

const handleJWTError = () => new AppError('Invalid token. Please login again.', HTTP_STATUS.UNAUTHORIZED);

const handleJWTExpired = () => new AppError('Token expired. Please login again.', HTTP_STATUS.UNAUTHORIZED);

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    if (error.name === 'CastError') error = handleCastError(error);
    else if (error.code === 11000) error = handleDuplicateKey(error);
    else if (error.name === 'ValidationError') error = handleValidationError(error);
    else if (error.name === 'JsonWebTokenError') error = handleJWTError();
    else if (error.name === 'TokenExpiredError') error = handleJWTExpired();
    else {
      error = new AppError(error.message || 'Internal server error', HTTP_STATUS.INTERNAL);
    }
  }

  logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, {
    statusCode: error.statusCode,
    stack: error.stack,
  });

  res.status(error.statusCode || HTTP_STATUS.INTERNAL).json({
    success: false,
    message: error.message || 'Internal server error',
    code: error.code,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
