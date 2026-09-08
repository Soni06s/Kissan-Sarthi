import { Router } from 'express';
import * as fertilizerController from '../controllers/fertilizer.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { fertilizerValidator } from '../validators/resource.validator.js';

const router = Router();

router.use(protect);
router.post('/calculate', fertilizerValidator, validate, fertilizerController.calculateFertilizer);
router.get('/history', fertilizerController.getFertilizerHistory);
router.get('/report/:id/pdf', fertilizerController.downloadFertilizerPdf);

export default router;
