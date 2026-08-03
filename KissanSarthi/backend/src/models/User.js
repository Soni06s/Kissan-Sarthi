import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { 
      type: String, 
      required: [function() { return this.provider === 'local'; }, 'Password is required for local authentication'], 
      minlength: 6, 
      select: false 
    },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    firebaseUID: { type: String, unique: true, sparse: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.FARMER },
    location: { type: String, default: 'Samba, J&K', trim: true },
    farmSize: { type: Number, default: 0, min: 0 },
    profileImage: { type: String, default: null },
    phone: { type: String, trim: true, unique: true, sparse: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true },
    address: { type: String, trim: true },
    gender: { type: String, trim: true },
    dob: { type: Date },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    refreshToken: { type: String, select: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpLastSent: { type: Date, select: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ phone: 1 }, { sparse: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
