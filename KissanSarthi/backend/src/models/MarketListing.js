import mongoose from 'mongoose';

const marketListingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: { type: String, required: [true, 'Crop name is required'], trim: true },
    category: {
      type: String,
      enum: ['Cereals & Grains', 'Pulses', 'Vegetables', 'Fruits', 'Oilseeds', 'Spices', 'Cash Crops', 'Other'],
      default: 'Cereals & Grains',
    },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: 0.1 },
    unit: { type: String, enum: ['quintal', 'kg', 'ton', 'crate', 'bag'], default: 'quintal' },
    pricePerUnit: { type: Number, required: [true, 'Price per unit is required'], min: 1 },
    images: [{ type: String }],
    location: { type: String, required: [true, 'Location is required'], trim: true },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    harvestDate: { type: Date, default: Date.now },
    description: { type: String, trim: true, maxlength: 1000 },
    contactNumber: { type: String, required: [true, 'Contact number is required'], trim: true },
    status: { type: String, enum: ['active', 'sold', 'expired'], default: 'active' },
    views: { type: Number, default: 0 },
    isBoosted: { type: Boolean, default: false, index: true },
    boostedUntil: { type: Date, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days auto-expire
    },
  },
  { timestamps: true }
);

marketListingSchema.index({ status: 1, isBoosted: -1, createdAt: -1 });
marketListingSchema.index({ cropName: 'text', location: 'text' });
marketListingSchema.index({ sellerId: 1 });

const MarketListing = mongoose.model('MarketListing', marketListingSchema);
export default MarketListing;
