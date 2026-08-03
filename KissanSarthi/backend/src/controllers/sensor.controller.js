import sensorService from '../services/sensor.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { ROLES } from '../config/constants.js';

export const getSensors = asyncHandler(async (req, res) => {
  const data = await sensorService.getAll(req.user._id);
  sendSuccess(res, 'Sensor data fetched', { sensors: data });
});

export const createSensor = asyncHandler(async (req, res) => {
  const data = await sensorService.create(req.user._id, req.body);
  sendSuccess(res, 'Sensor record created', { sensor: data }, HTTP_STATUS.CREATED);
});

export const updateSensor = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const data = await sensorService.update(req.params.id, req.user._id, req.body, isAdmin);
  sendSuccess(res, 'Sensor record updated', { sensor: data });
});

export const deleteSensor = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  await sensorService.delete(req.params.id, req.user._id, isAdmin);
  sendSuccess(res, 'Sensor record deleted');
});
