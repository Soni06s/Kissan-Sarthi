import Consultation from '../models/Consultation.js';
import User from '../models/User.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Get all available agricultural experts (public / farmers)
 */
export const getAvailableExperts = async (req, res, next) => {
  try {
    const experts = await User.find({
      role: 'expert',
      isActive: true,
      availableForConsultation: { $ne: false },
    })
      .select(
        'name email phone avatar profileImage isVerified verificationStatus role ' +
        'expertise specializations qualifications languagesSpoken consultationFee ' +
        'availableForConsultation experienceYears yearsExperience rating reviewsCount ' +
        'totalConsultations bio availability reviews'
      )
      .lean();

    return sendSuccess(res, 'Available experts retrieved successfully', experts);
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed profile of a single expert
 */
export const getExpertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expert = await User.findOne({ _id: id, role: 'expert', isActive: true })
      .select(
        'name email phone avatar profileImage isVerified verificationStatus role ' +
        'expertise specializations qualifications languagesSpoken consultationFee ' +
        'availableForConsultation experienceYears yearsExperience rating reviewsCount ' +
        'totalConsultations bio availability reviews createdAt'
      )
      .lean();

    if (!expert) {
      throw new AppError('Agri-Expert profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, 'Expert profile retrieved successfully', expert);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's consultations (either as farmer or as expert)
 */
export const getMyConsultations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isExpert = req.user.role === 'expert';

    const query = isExpert ? { expertId: userId } : { farmerId: userId };

    const consultations = await Consultation.find(query)
      .populate('farmerId', 'name email phone avatar profileImage location')
      .populate('expertId', 'name email phone avatar profileImage expertise specializations consultationFee')
      .populate('paymentId', 'amount currency status razorpayPaymentId')
      .sort({ updatedAt: -1 })
      .lean();

    return sendSuccess(res, 'Consultations retrieved successfully', consultations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single consultation details (with all messages)
 */
export const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id)
      .populate('farmerId', 'name email phone avatar profileImage location state')
      .populate('expertId', 'name email phone avatar profileImage expertise specializations qualifications consultationFee')
      .populate('paymentId', 'amount currency status razorpayPaymentId createdAt');

    if (!consultation) {
      throw new AppError('Consultation not found', HTTP_STATUS.NOT_FOUND);
    }

    const userId = String(req.user.id);
    const isAuthorized =
      String(consultation.farmerId._id) === userId ||
      String(consultation.expertId._id) === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      throw new AppError('Unauthorized access to this consultation', HTTP_STATUS.FORBIDDEN);
    }

    return sendSuccess(res, 'Consultation retrieved successfully', consultation);
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message in an ongoing 1-on-1 consultation
 */
export const sendConsultationMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, imageUrl } = req.body;

    if (!text || !text.trim()) {
      throw new AppError('Message text is required', HTTP_STATUS.BAD_REQUEST);
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new AppError('Consultation not found', HTTP_STATUS.NOT_FOUND);
    }

    const userId = String(req.user.id);
    const isFarmer = String(consultation.farmerId) === userId;
    const isExpert = String(consultation.expertId) === userId;

    if (!isFarmer && !isExpert && req.user.role !== 'admin') {
      throw new AppError('Unauthorized to send messages in this consultation', HTTP_STATUS.FORBIDDEN);
    }

    const senderRole = isFarmer ? 'farmer' : isExpert ? 'expert' : 'system';
    const messageObj = {
      senderId: req.user.id,
      senderRole,
      senderName: req.user.name || (isFarmer ? 'Farmer' : 'Agronomist'),
      text: text.trim(),
      imageUrl: imageUrl || null,
      createdAt: new Date(),
    };

    consultation.messages.push(messageObj);
    consultation.status = consultation.status === 'closed' ? 'active' : consultation.status;
    await consultation.save();

    // Broadcast over Socket.IO to room
    const io = req.app.get('io');
    if (io) {
      const payload = {
        consultationId: consultation._id,
        message: messageObj,
      };

      // Emit to consultation room
      io.to(`consultation_${consultation._id}`).emit('consultation_message', payload);

      // Also notify recipient's personal room
      const recipientId = isFarmer ? consultation.expertId : consultation.farmerId;
      io.to(`user_${recipientId}`).emit('consultation_message', payload);
    }

    return sendCreated(res, 'Message sent successfully', messageObj);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark consultation as resolved (by expert or admin)
 */
export const resolveConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id);

    if (!consultation) {
      throw new AppError('Consultation not found', HTTP_STATUS.NOT_FOUND);
    }

    const userId = String(req.user.id);
    if (String(consultation.expertId) !== userId && req.user.role !== 'admin') {
      throw new AppError('Only the assigned expert or admin can resolve this consultation', HTTP_STATUS.FORBIDDEN);
    }

    consultation.status = 'resolved';
    consultation.resolvedAt = new Date();
    await consultation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`consultation_${consultation._id}`).emit('consultation_resolved', {
        consultationId: consultation._id,
        resolvedAt: consultation.resolvedAt,
        message: 'This consultation has been marked resolved by the agronomist.',
      });
      io.to(`user_${consultation.farmerId}`).emit('consultation_resolved', {
        consultationId: consultation._id,
        resolvedAt: consultation.resolvedAt,
        message: 'Your consultation has been marked resolved. Please rate your expert!',
      });
    }

    return sendSuccess(res, 'Consultation marked as resolved', consultation);
  } catch (error) {
    next(error);
  }
};

/**
 * Rate and review expert after consultation resolution (by farmer)
 */
export const rateConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      throw new AppError('Please provide a valid rating between 1 and 5 stars', HTTP_STATUS.BAD_REQUEST);
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new AppError('Consultation not found', HTTP_STATUS.NOT_FOUND);
    }

    const userId = String(req.user.id);
    if (String(consultation.farmerId) !== userId) {
      throw new AppError('Only the farmer who booked can rate this consultation', HTTP_STATUS.FORBIDDEN);
    }

    // Save on consultation
    consultation.rating = numRating;
    consultation.review = review?.trim() || '';
    consultation.ratedAt = new Date();
    await consultation.save();

    // Update Expert User profile metrics and reviews array
    const expert = await User.findById(consultation.expertId);
    if (expert) {
      const reviewItem = {
        farmerId: req.user.id,
        farmerName: req.user.name || 'Progressive Farmer',
        rating: numRating,
        comment: review?.trim() || 'Thorough agronomic consultation.',
        date: new Date(),
      };

      expert.reviews = expert.reviews || [];
      expert.reviews.unshift(reviewItem);

      // Re-calculate weighted average
      const totalRatings = expert.reviews.reduce((sum, r) => sum + (r.rating || 5), 0);
      expert.reviewsCount = expert.reviews.length;
      expert.rating = Number((totalRatings / expert.reviewsCount).toFixed(1));

      await expert.save();
    }

    return sendSuccess(res, 'Thank you! Your review has been published.', {
      consultationId: consultation._id,
      rating: consultation.rating,
      review: consultation.review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all experts (including pending / unverified)
 */
export const adminGetExperts = async (req, res, next) => {
  try {
    const experts = await User.find({ role: 'expert' })
      .select('name email phone avatar isVerified verificationStatus expertise specializations qualifications consultationFee experienceYears rating reviewsCount totalConsultations availableForConsultation credentialDocUrl createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'All experts retrieved for admin review', experts);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Approve / Reject / Update Expert verification status
 */
export const adminUpdateExpertStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus, availableForConsultation, consultationFee } = req.body;

    const updateFields = {};
    if (verificationStatus) {
      updateFields.verificationStatus = verificationStatus;
      updateFields.isVerified = verificationStatus === 'verified';
    }
    if (typeof availableForConsultation === 'boolean') {
      updateFields.availableForConsultation = availableForConsultation;
    }
    if (consultationFee !== undefined) {
      updateFields.consultationFee = Number(consultationFee);
    }

    const expert = await User.findOneAndUpdate(
      { _id: id, role: 'expert' },
      { $set: updateFields },
      { new: true }
    );

    if (!expert) {
      throw new AppError('Expert account not found', HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, `Expert status updated to ${expert.verificationStatus}`, expert);
  } catch (error) {
    next(error);
  }
};
