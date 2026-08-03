import mongoose from 'mongoose';
import { ALERT_TYPES } from '../config/constants.js';

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ALERT_TYPES, default: 'info' },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1, read: 1, createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
