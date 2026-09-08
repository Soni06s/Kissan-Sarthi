import weatherService from '../services/weather.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getWeather = asyncHandler(async (req, res) => {
  const userLoc = req.user?.city ? `${req.user.city}${req.user.state ? `, ${req.user.state}` : ''}` : req.user?.location;
  const rawLoc = req.query.location || req.query.city || req.query.q || userLoc || 'Vadodara, Gujarat';
  const location = typeof rawLoc === 'string' && rawLoc.trim() ? rawLoc.trim() : 'Vadodara, Gujarat';
  const data = await weatherService.getForecast(location);
  sendSuccess(res, 'Weather forecast fetched', data);
});

export const createWeather = asyncHandler(async (req, res) => {
  const data = await weatherService.create(req.body);
  sendSuccess(res, 'Weather record created', { weather: data }, HTTP_STATUS.CREATED);
});
