import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kissansarthi';

  try {
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    await ensureAdminUser();
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
  });
};

export const ensureAdminUser = async () => {
  try {
    const User = (await import('../models/User.js')).default;
    const { ROLES } = await import('./constants.js');
    let admin = await User.findOne({ email: 'admin@kissansarthi.com' });
    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: 'admin@kissansarthi.com',
        password: 'Admin@123',
        role: ROLES.ADMIN,
        isVerified: true,
        isActive: true,
        location: 'Jammu, J&K',
        phone: '9876543210',
        verificationStatus: 'verified',
      });
      await admin.save();
      logger.info('Default Admin account created: admin@kissansarthi.com');
    } else if (!admin.isVerified || admin.role !== ROLES.ADMIN) {
      admin.role = ROLES.ADMIN;
      admin.isVerified = true;
      admin.verificationStatus = 'verified';
      await admin.save();
      logger.info('Default Admin account updated to verified: admin@kissansarthi.com');
    }
  } catch (err) {
    logger.warn(`Could not ensure admin user: ${err.message}`);
  }
};

export default connectDB;
