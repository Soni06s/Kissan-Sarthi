import { Router } from 'express';
import * as schemeController from '../controllers/scheme.controller.js';
import { optionalAuth, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, schemeController.getSchemes);
router.post('/:id/bookmark', protect, schemeController.toggleBookmark);

export default router;
