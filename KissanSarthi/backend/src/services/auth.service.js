import userRepository from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import { generateTokens } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/helpers.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';
import logger from '../config/logger.js';
import { generateOTP } from '../utils/generateOTP.js';
import { sendOTPEmail } from '../utils/sendOTP.js';
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
      if (!user.firebaseUID) {
        logger.info('googleLogin: Linking existing user with Firebase UID');
        await userRepository.updateById(user._id, {
          firebaseUID: uid,
          provider: user.provider === 'local' ? 'local' : 'google'
        });
      }
    }

    const tokens = generateTokens(user._id.toString());
    logger.info('googleLogin: JWT created successfully');
    
    await userRepository.updateById(user._id, { refreshToken: tokens.refreshToken });

    logger.info('googleLogin: Login completed successfully');
    return { user: sanitizeUser(user), ...tokens };
  }

  async register(data) {
    const { fullName, email, mobile, password, city, state, pincode, country, address, gender, dob, role } = data;
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
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

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
      role: role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.FARMER,
      isVerified: false,
      otp,
      otpExpires,
      otpLastSent: new Date(),
    });

    await sendOTPEmail({
      name: fullName ? fullName.trim() : '',
      email: normalizedEmail,
      otp,
      subject: 'Verify Your Email',
      template: 'verification',
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

    if (!user.isVerified) {
      await this.sendOtp(normalizedEmail, user);
      return {
        user: sanitizeUser(user),
        requiresVerification: true,
        message: 'Please verify your email before logging in.',
      };
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
    const cooldownMs = Number(process.env.OTP_RESEND_COOLDOWN_MS) || 60000;

    if (sentAt && now - sentAt < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now - sentAt)) / 1000);
      throw new AppError(`Please wait ${wait} seconds before requesting another OTP`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await userRepository.updateById(user._id, {
      otp,
      otpExpires,
      otpLastSent: new Date(),
    });

    await sendOTPEmail({
      name: user.name,
      email: normalizedEmail,
      otp,
      subject: 'Verify Your Email',
      template: 'verification',
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      throw new AppError('OTP must be a 6-digit number', HTTP_STATUS.BAD_REQUEST);
    }

    if (!user.otp || !user.otpExpires) {
      throw new AppError('No OTP requested', HTTP_STATUS.BAD_REQUEST);
    }

    if (new Date(user.otpExpires) < new Date()) {
      throw new AppError('OTP expired', HTTP_STATUS.BAD_REQUEST);
    }

    if (String(user.otp) !== String(otp)) {
      throw new AppError('Invalid OTP', HTTP_STATUS.BAD_REQUEST);
    }

    const tokens = generateTokens(user._id.toString());
    await userRepository.updateById(user._id, {
      isVerified: true,
      otp: null,
      otpExpires: null,
      otpLastSent: null,
      refreshToken: tokens.refreshToken,
    });

    return { user: sanitizeUser(user), ...tokens, message: 'Email verified successfully' };
  }

  async resendOtp(email) {
    return this.sendOtp(email);
  }

  async forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      return { message: 'If an account exists, a password reset OTP has been sent.' };
    }

    const now = Date.now();
    const sentAt = user.otpLastSent ? new Date(user.otpLastSent).getTime() : 0;
    const cooldownMs = Number(process.env.OTP_RESEND_COOLDOWN_MS) || 60000;

    if (sentAt && now - sentAt < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now - sentAt)) / 1000);
      throw new AppError(`Please wait ${wait} seconds before requesting another OTP`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await userRepository.updateById(user._id, {
      otp: otp,
      otpExpires,
      otpLastSent: new Date(),
    });

    await sendOTPEmail({
      name: user.name,
      email: normalizedEmail,
      otp,
      subject: 'Reset Your Password',
      template: 'reset',
    });

    logger.info(`Password reset OTP sent to ${normalizedEmail}`);
    return { message: 'If an account exists, a password reset OTP has been sent.' };
  }

  async verifyResetOtp({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmailWithOtp(normalizedEmail);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      throw new AppError('OTP must be a 6-digit number', HTTP_STATUS.BAD_REQUEST);
    }

    if (!user.otp || !user.otpExpires) {
      throw new AppError('No OTP requested', HTTP_STATUS.BAD_REQUEST);
    }

    if (new Date(user.otpExpires) < new Date()) {
      throw new AppError('OTP expired', HTTP_STATUS.BAD_REQUEST);
    }

    if (String(user.otp) !== String(otp)) {
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

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      throw new AppError('OTP must be a 6-digit number', HTTP_STATUS.BAD_REQUEST);
    }

    if (!user.otp || !user.otpExpires) {
      throw new AppError('No OTP requested', HTTP_STATUS.BAD_REQUEST);
    }

    if (new Date(user.otpExpires) < new Date()) {
      throw new AppError('OTP expired', HTTP_STATUS.BAD_REQUEST);
    }

    if (String(user.otp) !== String(otp)) {
      throw new AppError('Invalid OTP', HTTP_STATUS.BAD_REQUEST);
    }

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', HTTP_STATUS.BAD_REQUEST);
    }

    user.password = password;
    user.otp = null;
    user.otpExpires = null;
    user.otpLastSent = null;
    user.refreshToken = null;
    await user.save();

    const tokens = generateTokens(user._id.toString());
    await userRepository.updateById(user._id, { refreshToken: tokens.refreshToken });

    return { user: sanitizeUser(user), ...tokens, message: 'Password reset successfully' };
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
      'city', 'state', 'country', 'pincode', 'address', 'gender', 'dob'
    ];
    const update = {};

    allowed.forEach((key) => {
      if (data[key] !== undefined) update[key] = data[key];
    });

    const user = await userRepository.updateById(userId, update);
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    return sanitizeUser(user);
  }
}

export default new AuthService();
