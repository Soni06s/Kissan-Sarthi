import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import SensorData from '../src/models/SensorData.js';
import Weather from '../src/models/Weather.js';
import MarketPrice from '../src/models/MarketPrice.js';
import CommunityPost from '../src/models/CommunityPost.js';
import Alert from '../src/models/Alert.js';
import CropRecommendation from '../src/models/CropRecommendation.js';
import { ROLES, DEFAULT_MANDI } from '../src/config/constants.js';
import { seedDemoExperts } from '../src/seeds/seedExperts.js';
import { seedFarmers, DUMMY_FARMERS } from './farmers.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kissansarthi';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🌱 Connected to MongoDB for platform seeding...\n');

    // Clean ephemeral collections for fresh demo runs
    await Promise.all([
      SensorData.deleteMany({}),
      Weather.deleteMany({}),
      MarketPrice.deleteMany({}),
      Alert.deleteMany({}),
      CropRecommendation.deleteMany({}),
    ]);

    // 1. Ensure System Admin exists
    let admin = await User.findOne({ email: 'admin@kissansarthi.in' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@kissansarthi.in',
        password: 'Admin@123',
        role: ROLES.ADMIN,
        location: 'Jammu, J&K',
        phone: '+91 98765 43210',
        isVerified: true,
        isActive: true,
        verificationStatus: 'verified',
        authProvider: 'seed',
      });
      console.log('✅ Created Admin: admin@kissansarthi.in');
    }

    // 2. Ensure Primary Demo Farmer exists
    let farmer = await User.findOne({ email: 'farmer@kissansarthi.in' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Sahil Soni',
        email: 'farmer@kissansarthi.in',
        password: 'Password@123',
        role: ROLES.FARMER,
        location: 'Bari Brahmana, Samba, J&K',
        village: 'Bari Brahmana',
        district: 'Samba',
        state: 'Jammu & Kashmir',
        farmSize: 14.2,
        phone: '+91 98765 43211',
        isVerified: true,
        isActive: true,
        verificationStatus: 'verified',
        authProvider: 'seed',
      });
      console.log('✅ Created Primary Farmer: farmer@kissansarthi.in');
    }

    // Also support legacy sahil@kissansarthi.com if needed
    let legacyFarmer = await User.findOne({ email: 'sahil@kissansarthi.com' });
    if (!legacyFarmer) {
      legacyFarmer = await User.create({
        name: 'Sahil Soni (Legacy)',
        email: 'sahil@kissansarthi.com',
        password: 'Farmer@123',
        role: ROLES.FARMER,
        location: 'Bari Brahmana, J&K',
        farmSize: 14.2,
        isVerified: true,
        isActive: true,
        authProvider: 'seed',
      });
    }

    const activeFarmerId = farmer._id;

    // 3. Seed 5 Verified Certified Agronomists & Experts
    console.log('\n🔬 Seeding certified expert profiles...');
    await seedDemoExperts();

    // 4. Seed 10 Realistic Dummy Indian Farmers (Direct DB Insert, Bypass OTP)
    console.log('\n🌾 Seeding 10 dummy farmer accounts...');
    const farmerSeedResult = await seedFarmers();

    // 5. Seed Sensor Telemetry for Primary Farmer
    const moistureValues = [72, 68, 74, 70, 75, 78, 73, 76, 71, 69, 74, 77, 72, 68];
    const sensorRecords = moistureValues.map((moisture, i) => ({
      temperature: 24 + (i % 5),
      soilMoisture: moisture,
      nitrogen: 55 + (i % 10),
      ph: 6.5 + (i % 3) * 0.1,
      humidity: 60 + (i % 15),
      nodeId: 'BB-001',
      timestamp: new Date(Date.now() - (13 - i) * 3600000),
      farmer: activeFarmerId,
    }));
    await SensorData.insertMany(sensorRecords);

    // 6. Seed Microclimate Weather Forecast
    const conditions = ['Sunny', 'Partly Cloudy', 'Heavy Rain', 'Thunderstorm', 'Showers', 'Mostly Sunny', 'Sunny'];
    const weatherRecords = conditions.map((condition, i) => ({
      location: 'Bari Brahmana, J&K',
      date: new Date(Date.now() + i * 86400000),
      temperature: [31, 28, 24, 22, 26, 30, 29][i],
      humidity: [45, 55, 80, 85, 60, 50, 48][i],
      rainfall: [5, 20, 80, 90, 40, 10, 15][i],
      windSpeed: [8, 12, 20, 25, 15, 10, 9][i],
      condition,
      sprayWindow: i === 2 || i === 3 ? 'Not recommended' : '6 AM - 10 AM',
      irrigationAdvice: i === 2 ? 'Skip irrigation — heavy rain expected' : 'Light irrigation recommended in evening',
    }));
    await Weather.insertMany(weatherRecords);

    // 7. Seed APMC Mandi Rates
    const commodities = [
      { name: 'Wheat', prices: [2200, 2280, 2350, 2300, 2420, 2450, 2480] },
      { name: 'Rice', prices: [3000, 3050, 3100, 3080, 3150, 3200, 3200] },
      { name: 'Onion', prices: [3500, 3400, 3300, 3200, 3000, 2900, 2800] },
      { name: 'Tomato', prices: [900, 950, 1000, 1050, 1100, 1150, 1200] },
      { name: 'Potato', prices: [1350, 1360, 1370, 1380, 1390, 1395, 1400] },
      { name: 'Mustard', prices: [5600, 5650, 5700, 5720, 5750, 5780, 5800] },
    ];

    const marketRecords = [];
    commodities.forEach(({ name, prices }) => {
      prices.forEach((price, i) => {
        const prev = prices[i - 1] || price;
        marketRecords.push({
          commodity: name,
          mandi: DEFAULT_MANDI,
          price,
          trend: price > prev ? 'up' : price < prev ? 'down' : 'stable',
          date: new Date(Date.now() - (6 - i) * 86400000),
        });
      });
    });
    await MarketPrice.insertMany(marketRecords);

    // 8. Seed Core Alerts
    await Alert.insertMany([
      {
        user: activeFarmerId,
        type: 'warning',
        message: 'Low moisture in field #3 — Consider irrigation',
      },
      {
        user: activeFarmerId,
        type: 'info',
        message: 'Wheat harvest optimal window: Nov 15-25',
      },
      {
        user: activeFarmerId,
        type: 'success',
        message: 'Soil health improved 12% this month',
      },
    ]);

    // 9. Seed Sample Crop Recommendation
    await CropRecommendation.create({
      user: activeFarmerId,
      soilType: 'loamy',
      season: 'rabi',
      nitrogen: 60,
      temperature: 28,
      rainfall: 150,
      recommendedCrop: 'Wheat',
      variety: 'HD-2967, PBW-343',
      yield: '4-5 ton/ha',
      confidence: 95,
      tips: ['Sow Oct-Nov', 'First irrigation at 21 days', 'Apply 120kg N/ha in splits'],
    });

    console.log('\n=============================================================');
    console.log('🎉 KissanSarthi Platform Database Seeded Successfully!');
    console.log('=============================================================');
    console.log('\n🔑 Core Demonstration Accounts:');
    console.log('  🛡️ Admin  : admin@kissansarthi.in  | Password: Admin@123');
    console.log('  🌾 Farmer : farmer@kissansarthi.in | Password: Password@123');
    console.log('  🔬 Expert : expert.ramesh@kissansarthi.in | Password: Password@123');

    console.log('\n🌾 10 Dummy Seeded Farmers (Password: 123456 | Direct Login, No OTP):');
    DUMMY_FARMERS.forEach((f, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2, ' ')}. ${f.name.padEnd(22, ' ')} | ${f.email.padEnd(38, ' ')} | Crop: ${f.primaryCrop}`);
    });
    console.log('\n=============================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Platform seed error:', error);
    process.exit(1);
  }
};

seed();
