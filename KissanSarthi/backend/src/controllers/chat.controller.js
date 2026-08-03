import chatbotService from '../services/chatbot.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const question = req.body.question || req.body.query || req.body.message;
  const data = await chatbotService.chat(req.user._id, question);
  sendSuccess(res, 'Chat response generated', data);
});

export const getChatHistory = asyncHandler(async (req, res) => {
  const data = await chatbotService.getHistory(req.user._id);
  sendSuccess(res, 'Chat history fetched', { history: data });
});
