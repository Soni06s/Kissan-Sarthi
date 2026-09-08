import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from './logger.js';

const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY;
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'kissansarthi_webhook_secret';

export const isRazorpayConfigured = Boolean(
  keyId &&
  keySecret &&
  !keyId.includes('placeholder') &&
  !keySecret.includes('placeholder')
);

let razorpayInstance = null;

if (isRazorpayConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    logger.info(`Razorpay SDK initialized in Test Mode with key: ${keyId.slice(0, 8)}...`);
  } catch (err) {
    logger.error(`Razorpay initialization error: ${err.message}`);
  }
} else {
  logger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not configured. Please set them in backend/.env.');
}

/**
 * Creates a Razorpay order via Razorpay SDK
 */
export const createRazorpayOrder = async ({ amountPaise, currency = 'INR', receipt, notes = {} }) => {
  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountPaise,
        currency,
        receipt,
        notes,
      });
      return order;
    } catch (err) {
      logger.error(`Razorpay orders.create failed: ${err.message}`);
      throw err;
    }
  }

  // Fallback if SDK failed to initialize
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    entity: 'order',
    amount: amountPaise,
    amount_paid: 0,
    amount_due: amountPaise,
    currency,
    receipt,
    status: 'created',
    notes,
    created_at: Math.floor(Date.now() / 1000),
  };
};

/**
 * Verifies Razorpay HMAC-SHA256 signature server-side
 */
export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;

  if (!keySecret) {
    logger.warn('RAZORPAY_KEY_SECRET missing; cannot verify HMAC-SHA256 signature.');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch (err) {
    logger.error(`Error verifying Razorpay signature: ${err.message}`);
    return false;
  }
};

/**
 * Verifies Razorpay Webhook signature
 */
export const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature || !webhookSecret) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
};

export const getRazorpayKeyId = () => keyId || 'rzp_test_TZVX93cDCioxs1';

export default razorpayInstance;
