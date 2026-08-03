import { Router } from 'express';
import * as marketController from '../controllers/market.controller.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { marketValidator } from '../validators/resource.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', optionalAuth, marketController.getMarket);
router.post('/', protect, authorize(ROLES.ADMIN), marketValidator, validate, marketController.createMarket);
router.put('/:id', protect, authorize(ROLES.ADMIN), marketController.updateMarket);
router.delete('/:id', protect, authorize(ROLES.ADMIN), marketController.deleteMarket);

export default router;
