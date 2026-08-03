import dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user);
  sendSuccess(res, 'Dashboard summary fetched', data);
});

export const getLive = asyncHandler(async (req, res) => {
  const data = await dashboardService.getLive(req.user);
  sendSuccess(res, 'Live data fetched', data);
});
