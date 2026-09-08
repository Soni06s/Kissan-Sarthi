import paymentService from '../services/payment.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

export const createOrder = async (req, res, next) => {
  try {
    const { purpose, amount, currency = 'INR', relatedId, metadata } = req.body;
    const result = await paymentService.createOrder({
      userId: req.user.id,
      purpose,
      amount,
      currency,
      relatedId,
      metadata,
    });
    return sendCreated(res, 'Payment order created successfully', result);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const io = req.app.get('io');
    const result = await paymentService.verifyPayment({
      userId: req.user.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      io,
    });
    return sendSuccess(res, 'Payment verified and fulfilled successfully', result);
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;
    const io = req.app.get('io');
    const result = await paymentService.handleWebhook({
      payload,
      signature,
      io,
    });
    return sendSuccess(res, 'Webhook processed', result);
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getUserPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getUserPayments(req.user.id, req.query);
    return sendSuccess(res, 'User payments retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const downloadReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    await paymentService.generateReceiptPdf(paymentId, req.user.id, res);
  } catch (error) {
    next(error);
  }
};
