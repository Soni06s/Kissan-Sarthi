import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['farmer', 'expert', 'system'], default: 'farmer' },
    senderName: { type: String, trim: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true }
);

const consultationSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    amount: { type: Number, required: true },
    crop: { type: String, trim: true, default: 'General Crop Issue' },
    problemCategory: {
      type: String,
      trim: true,
      default: 'General Advisory',
      enum: [
        'Pest Infestation',
        'Soil Deficiency & Nutrients',
        'Crop Disease & Blight',
        'Irrigation & Water Management',
        'Organic Farming Practices',
        'Fertilizer Dosage',
        'Market & Harvest Timing',
        'General Advisory',
      ],
    },
    problemDescription: { type: String, trim: true, maxlength: 2500 },
    imageUrl: { type: String, default: null },
    attachments: [{ type: String }],
    scheduledSlot: { type: String, default: 'Immediate (Online Consultation)' },
    status: {
      type: String,
      enum: ['active', 'pending', 'resolved', 'closed'],
      default: 'active',
      index: true,
    },
    messages: [messageSchema],
    // Legacy single Q&A backward compatibility
    question: { type: String, trim: true },
    response: { type: String, default: null, trim: true },
    answeredAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    // Farmer Feedback & Rating
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, trim: true, maxlength: 1000, default: null },
    ratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

consultationSchema.index({ farmerId: 1, createdAt: -1 });
consultationSchema.index({ expertId: 1, status: 1 });

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;
