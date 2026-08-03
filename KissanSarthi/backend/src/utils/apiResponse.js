import { HTTP_STATUS } from '../config/constants.js';

export const sendSuccess = (res, message = 'Success', data = {}, status = HTTP_STATUS.OK) => {
  return res.status(status).json({ success: true, message, data });
};

export const sendError = (res, message = 'Error', errors = [], status = HTTP_STATUS.BAD_REQUEST) => {
  return res.status(status).json({ success: false, message, errors });
};
