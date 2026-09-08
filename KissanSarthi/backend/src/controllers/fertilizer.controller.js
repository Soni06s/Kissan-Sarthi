import fertilizerService from '../services/fertilizer.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { emitFertilizerCalc } from '../sockets/index.js';

export const calculateFertilizer = asyncHandler(async (req, res) => {
  const userLoc = req.user?.city ? `${req.user.city}, ${req.user.state || ''}` : (req.user?.location || req.body.location);
  const data = await fertilizerService.calculate({ ...req.body, location: userLoc, userId: req.user?._id });
  const io = req.app.get('io');
  if (io && req.user?._id) {
    emitFertilizerCalc(io, req.user._id, data);
  }
  sendSuccess(res, 'Fertilizer recommendation calculated', data);
});

export const getFertilizerHistory = asyncHandler(async (req, res) => {
  const data = await fertilizerService.getHistory(req.user._id);
  sendSuccess(res, 'Fertilizer history fetched', { history: data });
});

export const downloadFertilizerPdf = asyncHandler(async (req, res) => {
  const pdfReportService = (await import('../services/pdfReport.service.js')).default;
  await pdfReportService.generateFertilizerReport(req.params.id, req.user, res);
});
