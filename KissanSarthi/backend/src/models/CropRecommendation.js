import mongoose from 'mongoose';

const cropRecommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    soilType: { type: String, required: true },
    season: { type: String, required: true },
    nitrogen: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
    rainfall: { type: Number, default: 0 },
    recommendedCrop: { type: String, required: true },
    variety: { type: String, default: '' },
    yield: { type: String, default: '' },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    tips: [{ type: String }],
  },
  { timestamps: true }
);

cropRecommendationSchema.index({ user: 1, createdAt: -1 });

const CropRecommendation = mongoose.model('CropRecommendation', cropRecommendationSchema);
export default CropRecommendation;
