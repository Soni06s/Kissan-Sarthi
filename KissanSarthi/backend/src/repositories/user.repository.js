import User from '../models/User.js';

class UserRepository {
  create(data) {
    return User.create(data);
  }

  findById(id) {
    return User.findById(id);
  }

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findByPhone(phone) {
    return User.findOne({ phone });
  }

  findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken +otpLastSent');
  }

  findByPhoneWithPassword(phone) {
    return User.findOne({ phone }).select('+password +refreshToken +otpLastSent');
  }

  findByEmailWithOtp(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpires +otpHash +otpExpiresAt +otpLastSent');
  }

  findByEmailOrPhoneWithPassword(identifier) {
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };
    return User.findOne(query).select('+password +refreshToken');
  }

  findByResetToken(hashedToken) {
    return User.findOne({
      resetTokenHash: hashedToken,
      resetTokenExpiresAt: { $gt: Date.now() },
    }).select('+password +resetTokenHash +resetTokenExpiresAt');
  }

  updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  findAll(filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;
    return User.find(filter).sort(sort).skip(skip).limit(limit);
  }

  count(filter = {}) {
    return User.countDocuments(filter);
  }
}

export default new UserRepository();
