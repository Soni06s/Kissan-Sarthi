export class AppError extends Error {
  constructor(message, statusCode = 500, errors = [], code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
