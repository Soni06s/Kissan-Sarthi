import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import SensorData from '../src/models/SensorData.js';
import Weather from '../src/models/Weather.js';
import MarketPrice from '../src/models/MarketPrice.js';
import CommunityPost from '../src/models/CommunityPost.js';
import Alert from '../src/models/Alert.js';
import CropRecommendation from '../src/models/CropRecommendation.js';
import { ROLES, DEFAULT_MANDI } from '../src/config/constants.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kissansarthi';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany({}),
      SensorData.deleteMany({}),
      Weather.deleteMany({}),
      MarketPrice.deleteMany({}),
      CommunityPost.deleteMany({}),
      Alert.deleteMany({}),
      CropRecommendation.deleteMany({}),
    ]);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@kissansarthi.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      location: 'Jammu, J&K',
      phone: '9876543210',
    });

    const farmer = await User.create({
      name: 'Sahil Soni',
      email: 'sahil@kissansarthi.com',
      password: 'Farmer@123',
      role: ROLES.FARMER,
      location: 'Bari Brahmana, J&K',
      farmSize: 14.2,
      phone: '9876543211',
    });

    const farmer2 = await User.create({
      name: 'Ramesh Kumar',
      email: 'ramesh@kissansarthi.com',
      password: 'Farmer@123',
      role: ROLES.FARMER,
      location: 'Samba, J&K',
      farmSize: 8.5,
      phone: '9876543212',
    });

    const moistureValues = [72, 68, 74, 70, 75, 78, 73, 76, 71, 69, 74, 77, 72, 68];
    const sensorRecords = moistureValues.map((moisture, i) => ({
      temperature: 24 + (i % 5),
      soilMoisture: moisture,
      nitrogen: 55 + (i % 10),
      ph: 6.5 + (i % 3) * 0.1,
      humidity: 60 + (i % 15),
      nodeId: 'BB-001',
      timestamp: new Date(Date.now() - (13 - i) * 3600000),
      farmer: farmer._id,
    }));
    await SensorData.insertMany(sensorRecords);

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

    await CommunityPost.insertMany([
      {
        author: farmer2._id,
        content:
          'Got excellent wheat yield this season - 5.2 ton/ha! Used HD-2967 variety with drip irrigation. The new soil testing showed pH was perfect.',
        likes: [farmer._id],
        comments: [{ author: farmer._id, text: 'Great results! Which fertilizer plan did you follow?' }],
      },
      {
        author: farmer._id,
        content:
          'Alert: Yellow rust disease spreading in our area. Spray Propiconazole 25% EC at 0.1% concentration immediately.',
        likes: [],
        comments: [],
      },
      {
        author: farmer2._id,
        content: 'Ragi millet harvested! Natural farming without chemicals. Sold directly to consumers at ₹5,500/quintal.',
        likes: [farmer._id, admin._id],
        comments: [{ author: admin._id, text: 'Excellent work on organic farming!' }],
      },
    ]);

    await Alert.insertMany([
      {
        user: farmer._id,
        type: 'warning',
        message: 'Low moisture in field #3 — Consider irrigation',
      },
      {
        user: farmer._id,
        type: 'info',
        message: 'Wheat harvest optimal window: Nov 15-25',
      },
      {
        user: farmer._id,
        type: 'success',
        message: 'Soil health improved 12% this month',
      },
    ]);

    await CropRecommendation.create({
      user: farmer._id,
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

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin:  admin@kissansarthi.com  / Admin@123');
    console.log('  Farmer: sahil@kissansarthi.com  / Farmer@123');
    console.log('  Farmer: ramesh@kissansarthi.com / Farmer@123');
    console.log('  Phone login: 9876543211 / Farmer@123\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
