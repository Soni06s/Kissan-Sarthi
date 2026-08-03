import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadProfileImage } from '../middlewares/upload.middleware.js';
import {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  otpValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
  updateProfileValidator,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/google', googleLoginValidator, validate, authController.googleLogin);
router.post('/send-otp', otpValidator, validate, authController.sendOtp);
router.post('/verify-otp', otpValidator, validate, authController.verifyOtp);
router.post('/resend-otp', otpValidator, validate, authController.resendOtp);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/verify-reset-otp', verifyResetOtpValidator, validate, authController.verifyResetOtp);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, uploadProfileImage, updateProfileValidator, validate, authController.updateProfile);

export default router;
