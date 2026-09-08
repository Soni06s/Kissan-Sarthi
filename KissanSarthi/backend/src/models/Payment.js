import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true, min: 1 }, // Amount in INR
    amountPaise: { type: Number, required: true, min: 100 }, // Amount in Paise (INR * 100)
    currency: { type: String, default: 'INR', uppercase: true },
    purpose: {
      type: String,
      enum: [
        'pro_subscription',
        'priority_listing',
        'expert_consultation',
        'marketplace_listing_fee',
      ],
      required: true,
      index: true,
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
    receiptUrl: { type: String, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
