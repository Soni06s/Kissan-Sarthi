import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import CommunityPost from '../src/models/CommunityPost.js';
import MarketListing from '../src/models/MarketListing.js';
import { ROLES } from '../src/config/constants.js';

export const DUMMY_FARMERS = [
  {
    name: 'Ramesh Yadav',
    email: 'ramesh.yadav.demo@kissansarthi.test',
    phone: '+91 98765 43001',
    passwordPlain: '123456',
    location: 'Bari Brahmana, Samba, Jammu & Kashmir',
    village: 'Bari Brahmana',
    district: 'Samba',
    state: 'Jammu & Kashmir',
    farmSize: 4.5,
    primaryCrop: 'Wheat',
    soilType: 'Alluvial',
    season: 'Rabi',
    preferredLanguage: 'hi',
    daysAgo: 90,
    bio: 'Cultivating 4.5 acres of high-yield wheat and seasonal vegetables in Samba district with micro-sprinkler irrigation.',
  },
  {
    name: 'Suresh Chandra Meena',
    email: 'suresh.meena.demo@kissansarthi.test',
    phone: '+91 98765 43002',
    passwordPlain: '123456',
    location: 'Kotputli, Jaipur, Rajasthan',
    village: 'Kotputli',
    district: 'Jaipur',
    state: 'Rajasthan',
    farmSize: 6.0,
    primaryCrop: 'Mustard',
    soilType: 'Sandy Loam',
    season: 'Rabi',
    preferredLanguage: 'hi',
    daysAgo: 80,
    bio: 'Progressive oilseed grower in Kotputli practicing integrated nutrient management with gypsum and organic vermicompost.',
  },
  {
    name: 'Balwinder Singh',
    email: 'balwinder.singh.demo@kissansarthi.test',
    phone: '+91 98765 43003',
    passwordPlain: '123456',
    location: 'Khanna, Ludhiana, Punjab',
    village: 'Khanna',
    district: 'Ludhiana',
    state: 'Punjab',
    farmSize: 8.0,
    primaryCrop: 'Rice (Paddy)',
    soilType: 'Loamy',
    season: 'Kharif',
    preferredLanguage: 'en',
    daysAgo: 70,
    bio: 'Grain farmer from Khanna utilizing laser land leveling and Direct Seeded Rice (DSR) to conserve groundwater.',
  },
  {
    name: 'Manoj Kumar Patel',
    email: 'manoj.patel.demo@kissansarthi.test',
    phone: '+91 98765 43004',
    passwordPlain: '123456',
    location: 'Anand, Anand, Gujarat',
    village: 'Anand',
    district: 'Anand',
    state: 'Gujarat',
    farmSize: 5.0,
    primaryCrop: 'Cotton',
    soilType: 'Black Soil',
    season: 'Kharif',
    preferredLanguage: 'gu',
    daysAgo: 60,
    bio: 'Cotton and pulse cultivator in Anand practicing drip fertigation and biological pest controls against pink bollworm.',
  },
  {
    name: 'Ashok Rao Deshmukh',
    email: 'ashok.deshmukh.demo@kissansarthi.test',
    phone: '+91 98765 43005',
    passwordPlain: '123456',
    location: 'Wardha, Wardha, Maharashtra',
    village: 'Wardha',
    district: 'Wardha',
    state: 'Maharashtra',
    farmSize: 7.5,
    primaryCrop: 'Soybean',
    soilType: 'Black Soil',
    season: 'Kharif',
    preferredLanguage: 'en',
    daysAgo: 50,
    bio: 'Vidarbha soybean farmer promoting broad-bed furrow (BBF) sowing methods and soil carbon enrichment.',
  },
  {
    name: 'Ganesh Naik',
    email: 'ganesh.naik.demo@kissansarthi.test',
    phone: '+91 98765 43006',
    passwordPlain: '123456',
    location: 'Belagavi, Belagavi, Karnataka',
    village: 'Belagavi',
    district: 'Belagavi',
    state: 'Karnataka',
    farmSize: 3.5,
    primaryCrop: 'Sugarcane',
    soilType: 'Red Loam',
    season: 'Kharif',
    preferredLanguage: 'en',
    daysAgo: 40,
    bio: 'Sugarcane grower in northern Karnataka using single-eye bud seedling technology and trash mulching.',
  },
  {
    name: 'Muthu Kumar',
    email: 'muthu.kumar.demo@kissansarthi.test',
    phone: '+91 98765 43007',
    passwordPlain: '123456',
    location: 'Erode, Erode, Tamil Nadu',
    village: 'Erode',
    district: 'Erode',
    state: 'Tamil Nadu',
    farmSize: 4.0,
    primaryCrop: 'Turmeric',
    soilType: 'Red Soil',
    season: 'Kharif',
    preferredLanguage: 'en',
    daysAgo: 30,
    bio: 'High-curcumin Salem turmeric cultivator in Erode with solar poly-tunnel dryers for direct export quality.',
  },
  {
    name: 'Rajendra Prasad Singh',
    email: 'rajendra.singh.demo@kissansarthi.test',
    phone: '+91 98765 43008',
    passwordPlain: '123456',
    location: 'Muzaffarpur, Muzaffarpur, Bihar',
    village: 'Muzaffarpur',
    district: 'Muzaffarpur',
    state: 'Bihar',
    farmSize: 2.5,
    primaryCrop: 'Maize',
    soilType: 'Alluvial',
    season: 'Kharif',
    preferredLanguage: 'hi',
    daysAgo: 20,
    bio: 'Hybrid maize cultivator in North Bihar with intercropped legumes for natural nitrogen replenishment.',
  },
  {
    name: 'Harpreet Kaur',
    email: 'harpreet.kaur.demo@kissansarthi.test',
    phone: '+91 98765 43009',
    passwordPlain: '123456',
    location: 'Bathinda, Bathinda, Punjab',
    village: 'Bathinda',
    district: 'Bathinda',
    state: 'Punjab',
    farmSize: 6.5,
    primaryCrop: 'Wheat',
    soilType: 'Alluvial',
    season: 'Rabi',
    preferredLanguage: 'en',
    daysAgo: 12,
    bio: 'Bathinda farmer utilizing happy seeders for zero-tillage wheat sowing directly into rice residue.',
  },
  {
    name: 'Devendra Chouhan',
    email: 'devendra.chouhan.demo@kissansarthi.test',
    phone: '+91 98765 43010',
    passwordPlain: '123456',
    location: 'Indore, Indore, Madhya Pradesh',
    village: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    farmSize: 5.5,
    primaryCrop: 'Soybean',
    soilType: 'Black Soil',
    season: 'Kharif',
    preferredLanguage: 'hi',
    daysAgo: 3,
    bio: 'Malwa region farmer cultivating certified JS-9560 soybean and chickpea in rotation with bio-fungicide seed treatments.',
  },
];

/**
 * Seeds 10 realistic Indian farmer accounts directly into MongoDB.
 * Ensures bcrypt-hashed passwords (123456), isVerified: true, and idempotent execution.
 */
export const seedFarmers = async () => {
  let insertedCount = 0;
  let alreadyExistedCount = 0;
  const createdFarmers = [];

  console.log('🌾 Checking and seeding 10 dummy farmer accounts...');

  for (const item of DUMMY_FARMERS) {
    const existing = await User.findOne({ email: item.email });

    if (existing) {
      alreadyExistedCount++;
      createdFarmers.push(existing);
      continue;
    }

    // Explicitly hash password with bcrypt salt rounds = 10
    const hashedPassword = await bcrypt.hash(item.passwordPlain, 10);
    const createdAtDate = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`;

    const newFarmer = await User.create({
      name: item.name,
      email: item.email,
      phone: item.phone,
      password: hashedPassword,
      role: ROLES.FARMER,
      provider: 'local',
      authProvider: 'seed',
      location: item.location,
      village: item.village,
      city: item.district,
      district: item.district,
      state: item.state,
      country: 'India',
      farmSize: item.farmSize,
      bio: item.bio,
      avatar: avatarUrl,
      profileImage: avatarUrl,
      isVerified: true,
      isActive: true,
      verificationStatus: 'unverified',
      verificationDetails: {
        documentType: 'Kisan Credit Card / Land Record',
        farmSize: item.farmSize,
        primaryCrop: item.primaryCrop,
      },
      subscription: {
        plan: 'free',
        billingCycle: 'monthly',
      },
      preferredLanguage: item.preferredLanguage,
      preferences: {
        soilType: item.soilType,
        season: item.season,
        primaryCrop: item.primaryCrop,
      },
      createdAt: createdAtDate,
      updatedAt: createdAtDate,
    });

    insertedCount++;
    createdFarmers.push(newFarmer);
  }

  console.log(`\n📊 Farmer Seeding Summary:`);
  console.log(`   - Newly inserted : ${insertedCount}`);
  console.log(`   - Already existed: ${alreadyExistedCount}`);
  console.log(`   - Total farmers  : ${DUMMY_FARMERS.length}`);

  // Seed sample marketplace listings and community posts if none exist
  await seedFarmerContent(createdFarmers);

  return { insertedCount, alreadyExistedCount, total: DUMMY_FARMERS.length };
};

/**
 * Seed realistic community posts and marketplace listings authored by the seeded farmers
 */
async function seedFarmerContent(farmers) {
  try {
    const farmerMap = {};
    for (const f of farmers) {
      farmerMap[f.email] = f;
    }

    // 1. Seed Sample Produce Listings
    const sampleListings = [
      {
        farmerEmail: 'ramesh.yadav.demo@kissansarthi.test',
        cropName: 'Sharbati Wheat (Grade A)',
        category: 'Cereals & Grains',
        quantity: 50,
        unit: 'quintal',
        pricePerUnit: 2450,
        location: 'Bari Brahmana, Samba, Jammu & Kashmir',
        state: 'Jammu & Kashmir',
        district: 'Samba',
        contactNumber: '+91 98765 43001',
        description: 'Prime quality clean Sharbati wheat, sun-dried with less than 10% moisture content. Ready for immediate pickup from farm gate.',
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
      },
      {
        farmerEmail: 'manoj.patel.demo@kissansarthi.test',
        cropName: 'Shankar-6 Raw Cotton',
        category: 'Cash Crops',
        quantity: 35,
        unit: 'quintal',
        pricePerUnit: 6800,
        location: 'Anand, Anand, Gujarat',
        state: 'Gujarat',
        district: 'Anand',
        contactNumber: '+91 98765 43004',
        description: 'First picking Shankar-6 long-staple cotton (28-29mm). Zero trash contamination, packed in clean cotton bales.',
        images: ['https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=800&q=80'],
      },
      {
        farmerEmail: 'devendra.chouhan.demo@kissansarthi.test',
        cropName: 'JS-9560 Yellow Soybean',
        category: 'Oilseeds',
        quantity: 45,
        unit: 'quintal',
        pricePerUnit: 4650,
        location: 'Indore, Indore, Madhya Pradesh',
        state: 'Madhya Pradesh',
        district: 'Indore',
        contactNumber: '+91 98765 43010',
        description: 'High-oil content (19.5%) yellow soybean grains cleaned via grading machine. Excellent for oil expellers and food processing units.',
        images: ['https://images.unsplash.com/photo-1599588647953-fe3294843356?auto=format&fit=crop&w=800&q=80'],
      },
      {
        farmerEmail: 'muthu.kumar.demo@kissansarthi.test',
        cropName: 'Salem Finger Turmeric',
        category: 'Spices',
        quantity: 20,
        unit: 'quintal',
        pricePerUnit: 13500,
        location: 'Erode, Erode, Tamil Nadu',
        state: 'Tamil Nadu',
        district: 'Erode',
        contactNumber: '+91 98765 43007',
        description: 'Natural dried Salem finger turmeric with high curcumin (>3.8%). Polished, unadulterated, and aroma-rich.',
        images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'],
      },
    ];

    for (const item of sampleListings) {
      const author = farmerMap[item.farmerEmail];
      if (!author) continue;

      const existingListing = await MarketListing.findOne({
        sellerId: author._id,
        cropName: item.cropName,
      });

      if (!existingListing) {
        await MarketListing.create({
          sellerId: author._id,
          cropName: item.cropName,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          location: item.location,
          state: item.state,
          district: item.district,
          contactNumber: item.contactNumber,
          description: item.description,
          images: item.images,
          status: 'active',
          views: Math.floor(Math.random() * 40) + 10,
        });
      }
    }

    // 2. Seed Sample Community Discussions
    const samplePosts = [
      {
        farmerEmail: 'balwinder.singh.demo@kissansarthi.test',
        title: 'Water savings with Direct Seeded Rice (DSR) in Ludhiana',
        content: 'Adopted Tar-Vattar DSR on 4 acres this Kharif. Saved nearly 25% water pump electricity compared to conventional puddling. Key tip: apply Stomp 30 EC (Pendimethalin) within 24 hours of sowing to prevent early barnyard grass germination.',
        category: 'Crop Advice',
        tags: ['paddy', 'dsr', 'water-conservation', 'punjab'],
      },
      {
        farmerEmail: 'manoj.patel.demo@kissansarthi.test',
        title: 'Pink Bollworm management in Bt-Cotton',
        content: 'Installed 8 pheromone traps per acre in Anand cotton fields. Reached ETL (8 moths/trap for 3 consecutive nights) last week. Sprayed Profenophos 50 EC @ 2ml/L and results are positive. Inspect squares and bolls regularly!',
        category: 'Crop Advice',
        tags: ['cotton', 'pest-control', 'gujarat', 'pheromones'],
      },
      {
        farmerEmail: 'suresh.meena.demo@kissansarthi.test',
        title: 'Bumper yield from Giriraj mustard with single gypsum dressing',
        content: 'Applied 100 kg/acre gypsum during pre-sowing tillage in Jaipur sandy soil. Flowering was dense and pod filling has been stellar. Sulphur is often the hidden limiting factor for oilseeds!',
        category: 'Success Story',
        tags: ['mustard', 'gypsum', 'soil-fertility', 'rajasthan'],
      },
    ];

    for (const post of samplePosts) {
      const author = farmerMap[post.farmerEmail];
      if (!author) continue;

      const existingPost = await CommunityPost.findOne({
        author: author._id,
        title: post.title,
      });

      if (!existingPost) {
        await CommunityPost.create({
          author: author._id,
          title: post.title,
          content: post.content,
          category: post.category,
          tags: post.tags,
          status: 'active',
          location: {
            state: author.state,
            district: author.district,
            village: author.village,
          },
        });
      }
    }
  } catch (err) {
    console.warn('Note: Could not seed additional content:', err.message);
  }
}

// Standalone execution support: node seed/farmers.js
if (process.argv[1] && process.argv[1].endsWith('farmers.js')) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kissansarthi';
  (async () => {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB for farmer seeding...');
      await seedFarmers();
      await mongoose.connection.close();
      console.log('✅ Farmer seeding completed successfully.\n');
      process.exit(0);
    } catch (err) {
      console.error('❌ Farmer seeding error:', err);
      process.exit(1);
    }
  })();
}
