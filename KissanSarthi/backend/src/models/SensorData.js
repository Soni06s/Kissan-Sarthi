import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: { type: Number, required: true },
    soilMoisture: { type: Number, required: true, min: 0, max: 100 },
    nitrogen: { type: Number, default: 0 },
    ph: { type: Number, default: 7, min: 0, max: 14 },
    humidity: { type: Number, default: 0, min: 0, max: 100 },
    nodeId: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

sensorDataSchema.index({ farmer: 1, timestamp: -1 });
sensorDataSchema.index({ nodeId: 1, timestamp: -1 });

const SensorData = mongoose.model('SensorData', sensorDataSchema);
export default SensorData;
