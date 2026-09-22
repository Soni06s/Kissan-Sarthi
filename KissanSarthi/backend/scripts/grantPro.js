import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kissansarthi';

async function grantPro(targetIdentifier, days = 30) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const query = mongoose.isValidObjectId(targetIdentifier)
      ? { _id: targetIdentifier }
      : { email: targetIdentifier.toLowerCase().trim() };

    const user = await User.findOne(query);
    if (!user) {
      console.error(`User not found for identifier: ${targetIdentifier}`);
      process.exit(1);
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    user.subscription = {
      plan: 'pro',
      billingCycle: days > 60 ? 'yearly' : 'monthly',
      startsAt: new Date(),
      expiresAt,
    };

    await user.save();

    console.log(`Successfully granted Pro to user: ${user.name} (${user.email})`);
    console.log(`Plan: ${user.subscription.plan} (expires: ${user.subscription.expiresAt.toISOString()})`);
  } catch (error) {
    console.error('Error granting Pro status:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

const target = process.argv[2] || 'admin@kissansarthi.in';
const days = parseInt(process.argv[3] || '30', 10);

grantPro(target, days);
