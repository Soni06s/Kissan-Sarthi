import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleHi: { type: String, trim: true },
    titleGu: { type: String, trim: true },
    ministry: { type: String, default: 'Ministry of Agriculture & Farmers Welfare' },
    category: {
      type: String,
      enum: ['Direct Financial Support', 'Crop Insurance', 'Soil & Nutrient', 'Irrigation', 'Machinery & Equipment', 'Organic Farming', 'Credit & Loans'],
      default: 'Direct Financial Support',
    },
    benefitAmount: { type: String, required: true },
    eligibility: {
      minLandSize: { type: Number, default: 0 }, // Acres
      maxLandSize: { type: Number, default: 1000 }, // Acres
      applicableStates: [{ type: String }], // empty means all India
      applicableCrops: [{ type: String }],
      summary: { type: String, required: true },
      documentsRequired: [{ type: String }],
    },
    applicationUrl: { type: String, required: true },
    description: { type: String, required: true },
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

schemeSchema.index({ category: 1 });
schemeSchema.index({ 'eligibility.minLandSize': 1, 'eligibility.maxLandSize': 1 });

const Scheme = mongoose.model('Scheme', schemeSchema);
export default Scheme;
