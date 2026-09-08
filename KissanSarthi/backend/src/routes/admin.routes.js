import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as consultationController from '../controllers/consultation.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(protect, authorize(ROLES.ADMIN));
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReportStatus);
router.get('/verifications', adminController.getVerifications);
router.patch('/verifications/:id', adminController.reviewVerification);

// Expert Management Queue
router.get('/experts', consultationController.adminGetExperts);
router.patch('/experts/:id/status', consultationController.adminUpdateExpertStatus);

export default router;
