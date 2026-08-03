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
