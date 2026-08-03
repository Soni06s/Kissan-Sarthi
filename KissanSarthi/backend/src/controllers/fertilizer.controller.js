import fertilizerService from '../services/fertilizer.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const calculateFertilizer = asyncHandler(async (req, res) => {
  const data = await fertilizerService.calculate({ ...req.body, userId: req.user._id });
  sendSuccess(res, 'Fertilizer recommendation calculated', data);
});

export const getFertilizerHistory = asyncHandler(async (req, res) => {
  const data = await fertilizerService.getHistory(req.user._id);
  sendSuccess(res, 'Fertilizer history fetched', { history: data });
});
