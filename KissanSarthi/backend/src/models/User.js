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
    authProvider: { type: String, default: 'local' },
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
    village: { type: String, trim: true },
    avatar: { type: String, default: null },
    bio: { type: String, trim: true, maxlength: 500 },
    gender: { type: String, trim: true },
    dob: { type: Date },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    refreshToken: { type: String, select: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    preferredLanguage: { type: String, enum: ['en', 'hi', 'gu'], default: 'en' },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    verificationDetails: {
      documentUrl: { type: String, default: null },
      documentType: { type: String, default: 'Kisan Credit Card / Land Record' },
      farmSize: { type: Number, default: 0 },
      primaryCrop: { type: String, default: '' },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      rejectionReason: { type: String, default: '' },
    },
    subscription: {
      plan: { type: String, enum: ['free', 'pro'], default: 'free' },
      billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      startsAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },
    usage: {
      recommendationsThisMonth: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    consultationFee: { type: Number, default: 99, min: 0 },
    availableForConsultation: { type: Boolean, default: false },
    expertise: [{ type: String }],
    specializations: [{ type: String }],
    qualifications: [{ type: String }],
    languagesSpoken: [{ type: String }],
    experienceYears: { type: Number, default: 5 },
    yearsExperience: { type: Number, default: 5 },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    profilePhotoUrl: { type: String, default: null },
    credentialDocUrl: { type: String, default: null },
    availability: { type: String, enum: ['online', 'offline', 'busy'], default: 'online' },
    reviews: [
      {
        farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        farmerName: { type: String, default: 'Progressive Farmer' },
        rating: { type: Number, min: 1, max: 5, default: 5 },
        comment: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpLastSent: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (typeof this.password === 'string' && /^\$2[aby]\$\d{2}\$/.test(this.password)) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
