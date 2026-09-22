import PDFDocument from 'pdfkit';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import MarketListing from '../models/MarketListing.js';
import Consultation from '../models/Consultation.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
  getRazorpayKeyId,
} from '../config/razorpay.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import { sanitizeUser } from '../utils/helpers.js';
import logger from '../config/logger.js';

class PaymentService {
  /**
   * Step 1: Create a Razorpay Order
   */
  async createOrder({ userId, purpose, amount, currency = 'INR', relatedId = null, metadata = {} }) {
    if (!amount || amount <= 0) {
      throw new AppError('Valid payment amount is required', HTTP_STATUS.BAD_REQUEST);
    }

    const amountPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_${Date.now()}_${String(userId).slice(-4)}`;

    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      currency,
      receipt,
      notes: {
        userId: String(userId),
        purpose,
        relatedId: relatedId ? String(relatedId) : '',
      },
    });

    const payment = await Payment.create({
      userId,
      razorpayOrderId: rzpOrder.id,
      amount: Number(amount),
      amountPaise,
      currency,
      purpose,
      relatedId: relatedId || null,
      metadata,
      status: 'created',
    });

    return {
      orderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise for Razorpay frontend SDK
      amountInRupees: Number(amount),
      currency: rzpOrder.currency,
      keyId: getRazorpayKeyId(),
      paymentId: payment._id,
      purpose,
    };
  }

  /**
   * Step 2: Verify Razorpay Payment Signature and fulfill purchase
   */
  async verifyPayment({ userId, razorpayOrderId, razorpayPaymentId, razorpaySignature, io = null }) {
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      throw new AppError('Payment transaction record not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify signature using HMAC-SHA256
    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      payment.status = 'failed';
      payment.failureReason = 'Cryptographic signature mismatch';
      await payment.save();
      throw new AppError('Payment signature verification failed. Tampered or fraudulent transaction.', HTTP_STATUS.BAD_REQUEST);
    }

    // Mark as paid
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paidAt = new Date();
    await payment.save();

    let fulfillmentData = {};

    // ─── Purpose 1: Pro Subscription ───────────────────────────────────────
    if (payment.purpose === 'pro_subscription') {
      const billingCycle = payment.metadata?.billingCycle || 'monthly';
      const durationDays = billingCycle === 'yearly' ? 365 : 30;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'subscription.plan': 'pro',
            'subscription.billingCycle': billingCycle,
            'subscription.startsAt': new Date(),
            'subscription.expiresAt': expiresAt,
          },
        },
        { new: true }
      );

      fulfillmentData = {
        plan: 'pro',
        billingCycle,
        expiresAt,
        user: sanitizeUser(user),
        message: 'KissanSarthi Pro Subscription Activated! Enjoy unlimited scans and priority features.',
      };
    }

    // ─── Purpose 2: Priority / Boosted Listing ─────────────────────────────
    if (payment.purpose === 'priority_listing') {
      const listingId = payment.relatedId || payment.metadata?.listingId;
      if (listingId) {
        const boostedUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days boost
        const listing = await MarketListing.findByIdAndUpdate(
          listingId,
          {
            $set: {
              isBoosted: true,
              boostedUntil,
            },
          },
          { new: true }
        );

        fulfillmentData = {
          listingId,
          isBoosted: true,
          boostedUntil,
          message: 'Produce listing boosted for 3 days! Now pinned to the top of the Marketplace.',
        };
      }
    }

    // ─── Purpose 3: Paid Expert Consultation ───────────────────────────────
    if (payment.purpose === 'expert_consultation' || payment.purpose === 'consultation') {
      const expertId = payment.metadata?.expertId || payment.relatedId;
      const crop = payment.metadata?.crop || 'General Agriculture';
      const problemCategory = payment.metadata?.problemCategory || 'General Advisory';
      const problemDescription = payment.metadata?.problemDescription || payment.metadata?.question || 'Consultation inquiry regarding crop health.';
      const imageUrl = payment.metadata?.imageUrl || null;
      const scheduledSlot = payment.metadata?.scheduledSlot || 'Immediate (Online Consultation)';

      const farmer = await User.findById(userId).select('name phone location');

      const consultation = await Consultation.create({
        farmerId: userId,
        expertId,
        paymentId: payment._id,
        amount: payment.amount,
        crop,
        problemCategory,
        problemDescription,
        imageUrl,
        scheduledSlot,
        status: 'active',
        messages: [
          {
            senderId: userId,
            senderRole: 'farmer',
            senderName: farmer?.name || 'Farmer',
            text: problemDescription,
            imageUrl: imageUrl || null,
            createdAt: new Date(),
          },
        ],
      });

      // Update expert consultation metrics
      if (expertId) {
        await User.findByIdAndUpdate(expertId, {
          $inc: { totalConsultations: 1 },
        });
      }

      // Real-time socket notification to expert
      if (io && expertId) {
        io.to(`user_${expertId}`).emit('consultation_new', {
          consultationId: consultation._id,
          farmerName: farmer?.name || 'Farmer',
          farmerLocation: farmer?.location || 'India',
          problemCategory,
          problemDescription,
          crop,
          imageUrl,
          amount: payment.amount,
          createdAt: consultation.createdAt,
        });
      }

      fulfillmentData = {
        consultationId: consultation._id,
        status: 'active',
        message: '1-on-1 Consultation booked! Your session room is live.',
      };
    }

    return {
      payment,
      fulfillment: fulfillmentData,
    };
  }

  /**
   * Step 3: Handle Razorpay Webhooks
   */
  async handleWebhook({ rawBody, signature }) {
    const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
    if (!isValid) {
      throw new AppError('Invalid webhook signature', HTTP_STATUS.BAD_REQUEST);
    }

    const event = JSON.parse(rawBody);
    logger.info(`Razorpay Webhook Received: ${event.event}`);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const rzpPayment = event.payload.payment?.entity;
      if (rzpPayment?.order_id) {
        const payment = await Payment.findOneAndUpdate(
          { razorpayOrderId: rzpPayment.order_id },
          {
            $set: {
              status: 'paid',
              razorpayPaymentId: rzpPayment.id,
              paidAt: new Date(),
            },
          },
          { new: true }
        );

        if (payment && payment.purpose === 'pro_subscription') {
          const billingCycle = payment.metadata?.billingCycle || 'monthly';
          const durationDays = billingCycle === 'yearly' ? 365 : 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

          await User.findByIdAndUpdate(payment.userId, {
            $set: {
              'subscription.plan': 'pro',
              'subscription.billingCycle': billingCycle,
              'subscription.startsAt': new Date(),
              'subscription.expiresAt': expiresAt,
            },
          });
        }
      }
    }

    return { status: 'processed' };
  }

  /**
   * Fetch payment history for a user
   */
  async getUserPayments(userId) {
    return Payment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Generate downloadable branded PDF invoice / receipt using pdfkit
   */
  async generateReceiptPdf(paymentId, user, res) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new AppError('Payment record not found', HTTP_STATUS.NOT_FOUND);
    }

    if (String(payment.userId) !== String(user._id) && user.role !== 'admin') {
      throw new AppError('Unauthorized access to receipt', HTTP_STATUS.FORBIDDEN);
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KissanSarthi-Receipt-${payment.razorpayPaymentId || payment._id}.pdf"`);
    doc.pipe(res);

    // Header banner
    doc.rect(40, 40, 515, 65).fill('#1B5E20');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('KISSANSARTHI', 55, 52);
    doc.fontSize(10).font('Helvetica').text('Official Payment Tax Receipt & Transaction Acknowledgment', 55, 78);
    doc.fontSize(9).text(`Receipt Date: ${new Date().toLocaleDateString('en-IN')}`, 410, 78, { align: 'right' });

    doc.moveDown(3);

    // Receipt details
    doc.fillColor('#1F2937').fontSize(14).font('Helvetica-Bold').text('Transaction Details', 40, 125);
    doc.rect(40, 145, 515, 110).fillAndStroke('#F8FAFC', '#E2E8F0');

    doc.fillColor('#334155').fontSize(11).font('Helvetica');
    doc.text(`Receipt ID: KS-REC-${payment._id}`, 55, 155);
    doc.text(`Razorpay Order ID: ${payment.razorpayOrderId}`, 55, 172);
    doc.text(`Razorpay Payment ID: ${payment.razorpayPaymentId || 'N/A (Test/Simulated)'}`, 55, 189);
    doc.text(`Payment Purpose: ${payment.purpose.replace(/_/g, ' ').toUpperCase()}`, 55, 206);
    doc.text(`Transaction Status: ${payment.status.toUpperCase()} (${payment.paidAt ? 'Verified' : 'Pending'})`, 55, 223);

    // Customer info
    doc.text(`Customer: ${user.name}`, 340, 155);
    doc.text(`Phone: ${user.phone || 'Not provided'}`, 340, 172);
    doc.text(`Location: ${user.location || 'India'}`, 340, 189);
    doc.text(`Date Paid: ${payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : 'N/A'}`, 340, 206);

    // Itemized table
    doc.rect(40, 280, 515, 26).fill('#2E7D32');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11);
    doc.text('Description', 55, 288);
    doc.text('Qty', 350, 288);
    doc.text('Total (INR)', 450, 288, { align: 'right' });

    doc.fillColor('#1F2937').font('Helvetica').fontSize(11);
    doc.rect(40, 306, 515, 30).fillAndStroke('#FFFFFF', '#E2E8F0');
    
    let descriptionText = 'Service Transaction';
    if (payment.purpose === 'pro_subscription') {
      descriptionText = `KissanSarthi Pro Subscription (${payment.metadata?.billingCycle || 'Monthly'})`;
    } else if (payment.purpose === 'priority_listing') {
      descriptionText = 'Marketplace Produce Priority Boost (3 Days Top Pin)';
    } else if (payment.purpose === 'expert_consultation') {
      descriptionText = 'Agronomist Expert 1-on-1 Consultation Fee';
    }

    doc.fillColor('#1F2937').text(descriptionText, 55, 315);
    doc.text('1', 355, 315);
    doc.font('Helvetica-Bold').text(`₹${payment.amount.toLocaleString('en-IN')}.00`, 440, 315, { align: 'right' });

    // Total section
    doc.rect(340, 350, 215, 35).fill('#F1F8E9');
    doc.fillColor('#1B5E20').fontSize(12).font('Helvetica-Bold');
    doc.text('Grand Total Paid:', 350, 362);
    doc.text(`₹${payment.amount.toLocaleString('en-IN')}.00`, 460, 362, { align: 'right' });

    // Footer note
    doc.fontSize(9).font('Helvetica').fillColor('#64748B');
    doc.text('This is a system-generated electronic receipt for services rendered on KissanSarthi Platform. Razorpay Test Mode Payment Gateway.', 40, 420, { align: 'center', width: 515 });

    doc.end();
  }
}

export default new PaymentService();
