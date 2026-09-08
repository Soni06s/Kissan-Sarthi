import mongoose from 'mongoose';
import { MARKET_TRENDS } from '../config/constants.js';

const marketPriceSchema = new mongoose.Schema(
  {
    commodity: { type: String, required: true, trim: true },
    mandi: { type: String, required: true, trim: true },
    state: { type: String, default: 'Jammu & Kashmir', trim: true },
    district: { type: String, default: 'Samba', trim: true },
    price: { type: Number, required: true, min: 0 },
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    trend: { type: String, enum: MARKET_TRENDS, default: 'stable' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketPriceSchema.index({ commodity: 1, mandi: 1, date: -1 });
marketPriceSchema.index({ date: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);
export default MarketPrice;
