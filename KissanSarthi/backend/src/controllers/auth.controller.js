import authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

const setTokenCookies = (res, tokens) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  sendSuccess(res, result.message, {}, HTTP_STATUS.CREATED);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  if (result.requiresVerification) {
    sendSuccess(res, result.message || 'Email verification required', { user: result.user, requiresVerification: true });
    return;
  }

  setTokenCookies(res, result);
  sendSuccess(res, 'Login successful', { user: result.user, accessToken: result.accessToken });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin(req.body.idToken);
  setTokenCookies(res, result);
  sendSuccess(res, 'Google login successful', { user: result.user, accessToken: result.accessToken });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);
  sendSuccess(res, 'OTP sent to email');
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOtp({ email, otp });
  setTokenCookies(res, result);
  sendSuccess(res, result.message, { user: result.user, accessToken: result.accessToken });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendOtp(email);
  sendSuccess(res, result.message || 'OTP resent successfully');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  sendSuccess(res, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshToken(token);
  setTokenCookies(res, tokens);
  sendSuccess(res, 'Token refreshed', { accessToken: tokens.accessToken });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  sendSuccess(res, result.message);
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetOtp(req.body);
  sendSuccess(res, result.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  setTokenCookies(res, result);
  sendSuccess(res, result.message, { user: result.user, accessToken: result.accessToken });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  sendSuccess(res, 'Profile fetched', { user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.profileImage = `/uploads/profiles/${req.file.filename}`;
  }
  const user = await authService.updateProfile(req.user._id, data);
  sendSuccess(res, 'Profile updated', { user });
});
