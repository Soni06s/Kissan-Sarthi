import { body } from 'express-validator';

export const sensorValidator = [
  body('temperature').isFloat().withMessage('Temperature is required'),
  body('soilMoisture').isFloat({ min: 0, max: 100 }).withMessage('Soil moisture must be 0-100'),
  body('nodeId').trim().notEmpty().withMessage('Node ID is required'),
  body('nitrogen').optional().isFloat({ min: 0 }),
  body('ph').optional().isFloat({ min: 0, max: 14 }),
  body('humidity').optional().isFloat({ min: 0, max: 100 }),
];

export const weatherValidator = [
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('temperature').isFloat().withMessage('Temperature is required'),
  body('humidity').optional().isFloat({ min: 0, max: 100 }),
  body('rainfall').optional().isFloat({ min: 0 }),
  body('windSpeed').optional().isFloat({ min: 0 }),
  body('condition').optional().trim(),
  body('sprayWindow').optional().trim(),
  body('irrigationAdvice').optional().trim(),
];

export const cropRecommendValidator = [
  body('soilType').trim().notEmpty().withMessage('Soil type is required'),
  body('season').trim().notEmpty().withMessage('Season is required'),
  body('nitrogen').optional().isFloat({ min: 0 }),
  body('temperature').optional().isFloat(),
  body('rainfall').optional().isFloat({ min: 0 }),
];

export const marketValidator = [
  body('commodity').trim().notEmpty().withMessage('Commodity is required'),
  body('mandi').trim().notEmpty().withMessage('Mandi is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('trend').optional().isIn(['up', 'down', 'stable']),
];

export const fertilizerValidator = [
  body('crop').trim().notEmpty().withMessage('Crop is required'),
  body('stage').trim().notEmpty().withMessage('Growth stage is required'),
  body('soilPH').optional().isFloat({ min: 4, max: 9 }),
  body('deficiency').optional().trim(),
];

export const postValidator = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 5000 }),
  body('category').optional().isIn(['Crop Advice', 'Question', 'Disease Alert', 'Market Information', 'Success Story', 'Government Scheme', 'Weather Alert', 'Equipment', 'Organic Farming', 'General Discussion']),
  body('tags').optional(),
  body('visibility').optional().isIn(['public', 'followers', 'private']),
  body('status').optional().isIn(['draft', 'active']),
  body('location.state').optional().trim(),
  body('location.district').optional().trim(),
  body('location.village').optional().trim(),
];

export const commentValidator = [
  body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }),
];

export const alertValidator = [
  body('user').optional().isMongoId(),
  body('type').optional().isIn(['warning', 'info', 'success', 'critical']),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

export const chatValidator = [
  body('question').trim().notEmpty().withMessage('Question is required').isLength({ max: 500 }),
];
