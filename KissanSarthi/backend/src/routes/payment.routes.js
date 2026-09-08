import { Router } from 'express';
import { body } from 'express-validator';
import * as paymentController from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Webhook endpoint (Razorpay calls this directly with its HMAC signature)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes (farmer / buyer / seller / expert)
router.use(protect);

router.post(
  '/create-order',
  [
    body('amount').isNumeric().withMessage('Amount must be a positive number'),
    body('purpose')
      .isIn(['pro_subscription', 'priority_listing', 'expert_consultation', 'marketplace_listing_fee'])
      .withMessage('Invalid payment purpose'),
    validate,
  ],
  paymentController.createOrder
);

router.post(
  '/verify',
  [
    body('razorpayOrderId').notEmpty().withMessage('razorpayOrderId is required'),
    body('razorpayPaymentId').notEmpty().withMessage('razorpayPaymentId is required'),
    body('razorpaySignature').notEmpty().withMessage('razorpaySignature is required'),
    validate,
  ],
  paymentController.verifyPayment
);

router.get('/history', paymentController.getUserPayments);
router.get('/receipt/:paymentId', paymentController.downloadReceipt);

export default router;
