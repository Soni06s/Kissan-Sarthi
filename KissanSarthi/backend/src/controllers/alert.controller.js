import alertService from '../services/alert.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getAlerts = asyncHandler(async (req, res) => {
  const data = await alertService.getAlerts(req.user._id);
  sendSuccess(res, 'Alerts fetched', { alerts: data });
});

export const createAlert = asyncHandler(async (req, res) => {
  const userId = req.body.user || req.user._id;
  const data = await alertService.createAlert({ ...req.body, user: userId });
  sendSuccess(res, 'Alert created', { alert: data }, HTTP_STATUS.CREATED);
});

export const markAlertRead = asyncHandler(async (req, res) => {
  const data = await alertService.markAsRead(req.params.id, req.user._id);
  sendSuccess(res, 'Alert marked as read', { alert: data });
});
