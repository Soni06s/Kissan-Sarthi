import adminService from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const data = await adminService.getUsers(page);
  sendSuccess(res, 'Users fetched', data);
});

export const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  sendSuccess(res, 'User deleted');
});

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard();
  sendSuccess(res, 'Admin dashboard fetched', data);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const data = await adminService.toggleUserStatus(req.params.id, Boolean(isActive));
  sendSuccess(res, `User ${isActive ? 'activated' : 'deactivated'} successfully`, data);
});

export const getReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const data = await adminService.getReports(page);
  sendSuccess(res, 'Reports fetched successfully', data);
});

export const updateReportStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await adminService.updateReportStatus(req.params.id, status);
  sendSuccess(res, 'Report status updated', data);
});

export const getVerifications = asyncHandler(async (req, res) => {
  const data = await adminService.getVerificationRequests(req.query.status);
  sendSuccess(res, 'Verification requests fetched successfully', data);
});

export const reviewVerification = asyncHandler(async (req, res) => {
  const data = await adminService.reviewVerification(req.params.id, req.body);
  sendSuccess(res, `Verification updated to ${req.body.status}`, data);
});

