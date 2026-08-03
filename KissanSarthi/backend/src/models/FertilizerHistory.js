import mongoose from 'mongoose';

const fertilizerHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    crop: { type: String, required: true },
    stage: { type: String, required: true },
    soilPH: { type: Number, default: 6.5 },
    deficiency: { type: String, default: 'nitrogen' },
    recommendation: {
      primary: String,
      dose: String,
      secondary: String,
      schedule: String,
      cost: String,
      npk: [Number],
    },
  },
  { timestamps: true }
);

fertilizerHistorySchema.index({ user: 1, createdAt: -1 });

const FertilizerHistory = mongoose.model('FertilizerHistory', fertilizerHistorySchema);
export default FertilizerHistory;
