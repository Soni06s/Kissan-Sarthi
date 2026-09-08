import cropService from '../services/crop.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { emitCropAdvice } from '../sockets/index.js';

export const recommendCrop = asyncHandler(async (req, res) => {
  const userLoc = req.user?.city ? `${req.user.city}, ${req.user.state || ''}` : (req.user?.location || req.body.location);
  const data = await cropService.recommend({ ...req.body, location: userLoc, userId: req.user?._id });
  const io = req.app.get('io');
  if (io && req.user?._id) {
    emitCropAdvice(io, req.user._id, data);
  }
  if (req.user && req.user.usage) {
    req.user.usage.recommendationsThisMonth = (req.user.usage.recommendationsThisMonth || 0) + 1;
    await req.user.save().catch(() => {});
  }
  sendSuccess(res, 'Crop recommendation generated', data);
});

export const getCropHistory = asyncHandler(async (req, res) => {
  const data = await cropService.getHistory(req.user._id);
  sendSuccess(res, 'Crop history fetched', { history: data });
});

export const downloadCropPdf = asyncHandler(async (req, res) => {
  const pdfReportService = (await import('../services/pdfReport.service.js')).default;
  await pdfReportService.generateCropReport(req.params.id, req.user, res);
});
