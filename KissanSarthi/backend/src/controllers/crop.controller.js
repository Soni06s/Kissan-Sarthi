import cropService from '../services/crop.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const recommendCrop = asyncHandler(async (req, res) => {
  const data = await cropService.recommend({ ...req.body, userId: req.user._id });
  sendSuccess(res, 'Crop recommendation generated', data);
});

export const getCropHistory = asyncHandler(async (req, res) => {
  const data = await cropService.getHistory(req.user._id);
  sendSuccess(res, 'Crop history fetched', { history: data });
});
