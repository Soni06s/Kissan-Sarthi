import { Router } from 'express';
import * as cropController from '../controllers/crop.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { cropRecommendValidator } from '../validators/resource.validator.js';

const router = Router();

router.use(protect);
router.post('/recommend', cropRecommendValidator, validate, cropController.recommendCrop);
router.get('/history', cropController.getCropHistory);

export default router;
