import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(protect, authorize(ROLES.ADMIN));
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard', adminController.getAdminDashboard);

export default router;
