import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema(
  {
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, default: 0 },
    rainfall: { type: Number, default: 0 },
    windSpeed: { type: Number, default: 0 },
    condition: { type: String, default: 'Clear' },
    sprayWindow: { type: String, default: '' },
    irrigationAdvice: { type: String, default: '' },
  },
  { timestamps: true }
);

weatherSchema.index({ location: 1, date: -1 });

const Weather = mongoose.model('Weather', weatherSchema);
export default Weather;
