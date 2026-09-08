import crypto from 'crypto';
import userRepository from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import { generateTokens } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/helpers.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';
import logger from '../config/logger.js';
import { generateOTP } from '../utils/generateOTP.js';
import { sendOTPEmail, sendResetLinkEmail } from '../utils/sendOTP.js';
import { firebaseAdmin } from '../config/firebaseAdmin.js';

class AuthService {
  async googleLogin(idToken) {
    logger.info('googleLogin: Received Firebase Token');
    if (!idToken) {
      logger.error('googleLogin: Firebase ID Token is missing');
      throw new AppError('Firebase ID Token is required', HTTP_STATUS.BAD_REQUEST);
    }

    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      logger.info('googleLogin: Token verified successfully', { uid: decodedToken.uid });
    } catch (error) {
      logger.error('googleLogin: Firebase token verification failed', error);
      throw new AppError('Invalid or expired Google token', HTTP_STATUS.UNAUTHORIZED);
    }

    const { email, name, picture, uid } = decodedToken;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      logger.info('googleLogin: MongoDB user not found, creating new user');
      user = await userRepository.create({
        name: name || 'Google User',
        email: normalizedEmail,
        provider: 'google',
        firebaseUID: uid,
        profileImage: picture || null,
        isVerified: true, 
        role: ROLES.FARMER,
      });
      logger.info('googleLogin: MongoDB user created successfully', { userId: user._id });
    } else {
      logger.info('googleLogin: MongoDB user found', { userId: user._id });
      const updateData = {};
      if (!user.firebaseUID) {
        logger.info('googleLogin: Linking existing user with Firebase UID');
        updateData.firebaseUID = uid;
      }
      if (!user.isVerified) {
        updateData.isVerified = true;
      }
      if (picture && !user.profileImage) {
        updateData.profileImage = picture;
      }
      if (Object.keys(updateData).length > 0) {
        user = await userRepository.updateById(user._id, updateData);
      }
    }

    const tokens = generateTokens(user._id.toString());
    logger.info('googleLogin: JWT created successfully');
    
    await userRepository.updateById(user._id, { refreshToken: tokens.refreshToken });

    logger.info('googleLogin: Login completed successfully');
    return { user: sanitizeUser(user), ...tokens };
  }

  async register(data) {
    const { fullName, email, mobile, password, city, state, pincode, country, address, gender, dob, role, preferredLanguage } = data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await userRepository.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
    }

    if (mobile) {
      const existingPhone = await userRepository.findByPhone(mobile.trim());
      if (existingPhone) {
        throw new AppError('Mobile number already registered', HTTP_STATUS.CONFLICT);
      }
    }

    const otp = generateOTP();
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.create({
      name: fullName ? fullName.trim() : '',
      email: normalizedEmail,
      phone: mobile ? mobile.trim() : undefined,
      password,
      city: city ? city.trim() : undefined,
      state: state ? state.trim() : undefined,
      pincode: pincode ? pincode.trim() : undefined,
      country: country ? country.trim() : 'India',
      address: address ? address.trim() : undefined,
      gender: gender ? gender.trim() : undefined,
      dob: dob ? new Date(dob) : undefined,
      role: role === ROLES.ADMIN ? ROLES.ADMIN : (role === ROLES.EXPERT ? ROLES.EXPERT : ROLES.FARMER),
      preferredLanguage: preferredLanguage || 'en',
      isVerified: false,
      isActive: true,
      otpHash,
      otpExpiresAt,
      otp,
      otpExpires: otpExpiresAt,
      otpLastSent: new Date(),
    });

    await sendOTPEmail({
      name: fullName ? fullName.trim() : '',
      email: normalizedEmail,
      otp,
      subject: 'Verify Your Email',
      template: 'verification',
      language: preferredLanguage || 'en',
    });

    return {
      message: 'Registration successful. Please verify your email with the OTP sent to your inbox.',
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithPassword(normalizedEmail);

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.isActive === false) {
      throw new AppError('Your account has been deactivated. Please contact support.', HTTP_STATUS.FORBIDDEN, [], 'ACCOUNT_DEACTIVATED');
    }

    // Admin accounts bypass OTP verification completely
    if (user.role === ROLES.ADMIN) {
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else if (!user.isVerified) {
      try {
        await this.sendOtp(normalizedEmail, user);
      } catch (err) {
        // If rate limited, proceed to reject with verification required
      }
      throw new AppError('Please verify your email before logging in.', HTTP_STATUS.FORBIDDEN, [], 'ACCOUNT_NOT_VERIFIED');
    }

    const tokens = generateTokens(user._id.toString());
    await userRepository.updateById(user._id, { refreshToken: tokens.refreshToken });

    return { user: sanitizeUser(user), ...tokens };
  }

  async sendOtp(email, userOverride = null) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = userOverride || (await userRepository.findByEmailWithOtp(normalizedEmail));

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const now = Date.now();
    const sentAt = user.otpLastSent ? new Date(user.otpLastSent).getTime() : 0;
    const cooldownMs = 60 * 1000; // 60 seconds rate limit per email

    if (sentAt && now - sentAt < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now - sentAt)) / 1000);
      throw new AppError(`Please wait ${wait} seconds before requesting another OTP`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    const otp = generateOTP();
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.updateById(user._id, {
      otpHash,
      otpExpiresAt,
      otp,
      otpExpires: otpExpiresAt,
      otpLastSent: new Date(),
    });

    await sendOTPEmail({
      name: user.name,
      email: normalizedEmail,
      otp,
      subject: 'Verify Your Email',
      template: 'verification',
      language: user.preferredLanguage || 'en',
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      throw new AppError('OTP must be a 6-digit number', HTTP_STATUS.BAD_REQUEST);
    }

    const cleanOtp = String(otp).trim();
    const expiry = user.otpExpiresAt || user.otpExpires;
    if (!expiry) {
      throw new AppError('No OTP requested', HTTP_STATUS.BAD_REQUEST);
    }

    if (new Date(expiry) < new Date()) {
      throw new AppError('OTP has expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST);
    }

    const providedHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    const isValid = (user.otpHash && user.otpHash === providedHash) || (user.otp && String(user.otp) === cleanOtp);

    if (!isValid) {
      throw new AppError('Invalid OTP. Please check the code and try again.', HTTP_STATUS.BAD_REQUEST);
    }

    const tokens = generateTokens(user._id.toString());
    const updatedUser = await userRepository.updateById(user._id, {
      isVerified: true,
      otpHash: null,
      otpExpiresAt: null,
      otp: null,
      otpExpires: null,
      otpLastSent: null,
      refreshToken: tokens.refreshToken,
    });

    return { user: sanitizeUser(updatedUser || user), ...tokens, message: 'Email verified successfully' };
  }

  async resendOtp(email) {
    return this.sendOtp(email);
  }

  async forgotPassword({ email, mode = 'link' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      return { message: 'If an account exists with that email, password reset instructions have been sent.' };
    }

    const now = Date.now();
    const sentAt = user.otpLastSent ? new Date(user.otpLastSent).getTime() : 0;
    const cooldownMs = 60 * 1000;

    if (sentAt && now - sentAt < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now - sentAt)) / 1000);
      throw new AppError(`Please wait ${wait} seconds before requesting another reset email`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    if (mode === 'otp') {
      const otp = generateOTP();
      const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await userRepository.updateById(user._id, {
        otpHash,
        otpExpiresAt,
        otp,
        otpExpires: otpExpiresAt,
        otpLastSent: new Date(),
      });

      await sendOTPEmail({
        name: user.name,
        email: normalizedEmail,
        otp,
        subject: 'Reset Your Password',
        template: 'reset',
        language: user.preferredLanguage || 'en',
      });

      logger.info(`Password reset OTP sent to ${normalizedEmail}`);
    } else {
      // Default: Link-based reset with random 32-byte token (15 min expiry)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await userRepository.updateById(user._id, {
        resetTokenHash,
        resetTokenExpiresAt,
        otpLastSent: new Date(),
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetLink = `${clientUrl}/reset-password/${rawToken}`;

      await sendResetLinkEmail({
        name: user.name,
        email: normalizedEmail,
        resetLink,
        language: user.preferredLanguage || 'en',
      });

      logger.info(`Password reset link sent to ${normalizedEmail}`);
    }

    return { message: 'If an account exists with that email, password reset instructions have been sent.' };
  }

  async verifyResetOtp({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      throw new AppError('OTP must be a 6-digit number', HTTP_STATUS.BAD_REQUEST);
    }

    const expiry = user.otpExpiresAt || user.otpExpires;
    if (!expiry) {
      throw new AppError('No OTP requested', HTTP_STATUS.BAD_REQUEST);
    }

    if (new Date(expiry) < new Date()) {
      throw new AppError('OTP expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST);
    }

    const providedHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    const isValid = (user.otpHash && user.otpHash === providedHash) || (user.otp && String(user.otp) === cleanOtp);

    if (!isValid) {
      throw new AppError('Invalid OTP', HTTP_STATUS.BAD_REQUEST);
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword({ email, otp, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      throw new AppError('OTP must be a 6-digit number', HTTP_STATUS.BAD_REQUEST);
    }

    const expiry = user.otpExpiresAt || user.otpExpires;
    if (!expiry) {
      throw new AppError('No OTP requested', HTTP_STATUS.BAD_REQUEST);
    }

    if (new Date(expiry) < new Date()) {
      throw new AppError('OTP expired', HTTP_STATUS.BAD_REQUEST);
    }

    const providedHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    const isValid = (user.otpHash && user.otpHash === providedHash) || (user.otp && String(user.otp) === cleanOtp);

    if (!isValid) {
      throw new AppError('Invalid OTP', HTTP_STATUS.BAD_REQUEST);
    }

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', HTTP_STATUS.BAD_REQUEST);
    }

    user.password = password;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otp = null;
    user.otpExpires = null;
    user.otpLastSent = null;
    user.refreshToken = null; // Invalidate sessions
    await user.save();

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async resetPasswordWithToken(rawToken, newPassword) {
    if (!rawToken) {
      throw new AppError('Reset token is required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', HTTP_STATUS.BAD_REQUEST);
    }

    const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await userRepository.findByResetToken(resetTokenHash);

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST);
    }

    user.password = newPassword;
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    user.refreshToken = null; // Invalidate all existing refresh tokens (force re-login everywhere)
    await user.save();

    logger.info(`Password successfully reset via link for user ${user.email}`);
    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async logout(userId) {
    await userRepository.updateById(userId, { refreshToken: null });
    return true;
  }

  async refreshToken(token) {
    if (!token) {
      throw new AppError('Refresh token required', HTTP_STATUS.UNAUTHORIZED);
    }

    const jwt = await import('../utils/jwt.js');
    let decoded;

    try {
      decoded = jwt.verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
    }

    const userWithToken = await userRepository.findByEmailWithPassword(user.email);
    if (userWithToken.refreshToken !== token) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = generateTokens(user._id.toString());
    await userRepository.updateById(user._id, { refreshToken: tokens.refreshToken });

    return tokens;
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    return sanitizeUser(user);
  }

  async updateProfile(userId, data) {
    const allowed = [
      'name', 'location', 'farmSize', 'phone', 'preferences', 'profileImage',
      'city', 'state', 'country', 'pincode', 'address', 'gender', 'dob', 'preferredLanguage'
    ];
    const update = {};

    allowed.forEach((key) => {
      if (data[key] !== undefined) update[key] = data[key];
    });

    const user = await userRepository.updateById(userId, update);
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    return sanitizeUser(user);
  }

  async submitFarmerVerification(userId, data, documentUrl) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);

    const updateData = {
      verificationStatus: 'pending',
      verificationDetails: {
        documentUrl: documentUrl || user.verificationDetails?.documentUrl,
        documentType: data.documentType || 'Kisan Credit Card / Land Record',
        farmSize: Number(data.farmSize) || user.farmSize || 0,
        primaryCrop: data.primaryCrop || '',
        submittedAt: new Date(),
        rejectionReason: '',
      },
    };

    if (data.farmSize) updateData.farmSize = Number(data.farmSize);

    const updatedUser = await userRepository.updateById(userId, updateData);
    return sanitizeUser(updatedUser);
  }
}

export default new AuthService();
