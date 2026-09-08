import { body } from 'express-validator';

export const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full Name is required').isLength({ min: 3, max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').matches(/^\d{10}$/).withMessage('Mobile number must be exactly 10 digits'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters or digits'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().notEmpty().withMessage('Pincode is required').matches(/^\d{6}$/).withMessage('Pincode must be exactly 6 digits'),
  body('country').optional().trim(),
  body('address').optional().trim(),
  body('gender').optional().trim(),
  body('dob').optional().isISO8601().withMessage('Invalid Date of Birth format'),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const googleLoginValidator = [
  body('idToken').notEmpty().withMessage('Firebase ID Token is required'),
];

export const otpValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').optional().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits').isNumeric(),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const verifyResetOtpValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits').isNumeric(),
];

export const resetPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits').isNumeric(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const resetPasswordTokenValidator = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('location').optional().trim(),
  body('farmSize').optional().isFloat({ min: 0 }),
  body('phone').optional().trim(),
  body('preferredLanguage').optional().isIn(['en', 'hi', 'gu']).withMessage('Preferred language must be en, hi, or gu'),
];
