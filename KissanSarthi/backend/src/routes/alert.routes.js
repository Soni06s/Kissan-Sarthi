import { Router } from 'express';
import * as alertController from '../controllers/alert.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { alertValidator } from '../validators/resource.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);
router.get('/', alertController.getAlerts);
router.post('/', authorize(ROLES.ADMIN), alertValidator, validate, alertController.createAlert);
router.put('/:id/read', alertController.markAlertRead);

export default router;
