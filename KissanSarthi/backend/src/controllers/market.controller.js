import marketService from '../services/market.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getMarket = asyncHandler(async (req, res) => {
  const data = await marketService.getPrices({
    commodity: req.query.commodity,
    mandi: req.query.mandi,
  });
  sendSuccess(res, 'Market data fetched', data);
});

export const createMarket = asyncHandler(async (req, res) => {
  const data = await marketService.create(req.body);
  sendSuccess(res, 'Market price created', { price: data }, HTTP_STATUS.CREATED);
});

export const updateMarket = asyncHandler(async (req, res) => {
  const data = await marketService.update(req.params.id, req.body);
  sendSuccess(res, 'Market price updated', { price: data });
});

export const deleteMarket = asyncHandler(async (req, res) => {
  await marketService.delete(req.params.id);
  sendSuccess(res, 'Market price deleted');
});
