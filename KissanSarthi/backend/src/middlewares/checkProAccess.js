import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import User from '../models/User.js';

const FREE_LIMITS = {
  RECOMMENDATIONS: 5,
};

/**
 * Middleware to check crop recommendation quota
 */
export const checkCropRecommendationLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', HTTP_STATUS.UNAUTHORIZED));
    }

    // Auto-downgrade expired pro subscription
    const isPro = user.checkSubscription();
    if (user.isModified('subscription.plan')) {
      await user.save();
    }

    if (isPro) {
      req.user = user;
      return next();
    }

    // Check monthly reset
    const now = new Date();
    const lastReset = user.usage?.lastResetDate ? new Date(user.usage.lastResetDate) : now;
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.usage.scansThisMonth = 0;
      user.usage.recommendationsThisMonth = 0;
      user.usage.lastResetDate = now;
      await user.save();
    }

    const currentUsage = user.usage?.recommendationsThisMonth || 0;
    if (currentUsage >= FREE_LIMITS.RECOMMENDATIONS) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        code: 'UPGRADE_TO_PRO',
        message: `You have used your ${FREE_LIMITS.RECOMMENDATIONS} free crop recommendations this month. Upgrade to KissanSarthi Pro for unlimited crop advisory!`,
        data: {
          feature: 'crop_recommendations',
          limit: FREE_LIMITS.RECOMMENDATIONS,
          currentUsage,
          plan: 'free',
          upgradeUrl: '/pricing',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
