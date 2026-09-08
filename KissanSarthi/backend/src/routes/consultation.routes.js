import { Router } from 'express';
import { body } from 'express-validator';
import * as consultationController from '../controllers/consultation.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Public / optional auth to view available experts & full profiles
router.get('/experts', optionalAuth, consultationController.getAvailableExperts);
router.get('/experts/:id', optionalAuth, consultationController.getExpertById);

// Protected routes for managing 1-on-1 consultations
router.use(protect);

router.get('/', consultationController.getMyConsultations);
router.get('/:id', consultationController.getConsultationById);

// Send 1-on-1 chat message
router.post(
  '/:id/messages',
  [
    body('text').trim().notEmpty().withMessage('Message text is required'),
    validate,
  ],
  consultationController.sendConsultationMessage
);

// Mark resolved by expert
router.post('/:id/resolve', consultationController.resolveConsultation);

// Rate and review by farmer
router.post(
  '/:id/rate',
  [
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    validate,
  ],
  consultationController.rateConsultation
);

export default router;
