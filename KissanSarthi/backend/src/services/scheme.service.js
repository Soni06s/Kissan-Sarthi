import Scheme from '../models/Scheme.js';
import logger from '../config/logger.js';

const INITIAL_SCHEMES = [
  {
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    titleHi: 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
    titleGu: 'પ્રધાનમંત્રી કિસાન સન્માન નિધિ (પીએમ-કિસાન)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Direct Financial Support',
    benefitAmount: '₹6,000 / year (in 3 equal installments of ₹2,000)',
    eligibility: {
      minLandSize: 0,
      maxLandSize: 100,
      applicableStates: [], // All India
      applicableCrops: [],
      summary: 'All landholding farmer families having cultivable land in their names.',
      documentsRequired: ['Aadhaar Card', 'Land Holding Record (7/12 or RoR)', 'Active Bank Account linked to Aadhaar'],
    },
    applicationUrl: 'https://pmkisan.gov.in',
    description: 'Income support scheme transferring ₹6,000 annually directly into the bank accounts of farmer families across India to meet agriculture and domestic needs.',
  },
  {
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    titleHi: 'प्रधानमंत्री फसल बीमा योजना (पीएमएफबीવાય)',
    titleGu: 'પ્રધાનમંત્રી ફસલ બીમા યોજના (પીએમએફબીવાય)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Crop Insurance',
    benefitAmount: 'Up to 100% sum insured payout for non-preventable natural risks',
    eligibility: {
      minLandSize: 0,
      maxLandSize: 100,
      applicableStates: [],
      applicableCrops: ['Wheat', 'Rice', 'Cotton', 'Soybean', 'Maize', 'Mustard', 'Pulses'],
      summary: 'All farmers growing notified crops in notified areas including sharecroppers and tenant farmers.',
      documentsRequired: ['Crop Sowing Certificate', 'Land Possession Document / RoR', 'Bank Passbook'],
    },
    applicationUrl: 'https://pmfby.gov.in',
    description: 'Comprehensive crop insurance covering non-preventable natural risks from pre-sowing to post-harvest at a nominal farmer premium (1.5% - 2% for food crops, 5% for commercial/horticultural crops).',
  },
  {
    title: 'Per Drop More Crop - PMKSY (Micro-Irrigation)',
    titleHi: 'प्रति बूंद अधिक फसल - पीएमकेएसवाई (सूक्ष्म सिंचाई)',
    titleGu: 'પ્રતિ બુંદ અધિક પાક - પીએમકેએસવાય (ટપક/ફુવારા પિયત)',
    ministry: 'Department of Agriculture & Farmers Welfare',
    category: 'Irrigation',
    benefitAmount: 'Up to 55% subsidy for small & marginal farmers, 45% for other farmers',
    eligibility: {
      minLandSize: 0.5,
      maxLandSize: 12.5,
      applicableStates: [],
      applicableCrops: ['Sugarcane', 'Cotton', 'Vegetables', 'Fruits', 'Maize'],
      summary: 'Farmers with assured water source adopting Drip or Sprinkler irrigation systems.',
      documentsRequired: ['Land Ownership Document', 'Electricity Bill / Water Source Proof', 'Soil & Water Test Report'],
    },
    applicationUrl: 'https://pmksy.gov.in',
    description: 'Focuses on water use efficiency at farm level through Precision and Micro Irrigation technologies (Drip and Sprinkler systems) with substantial government subsidies.',
  },
  {
    title: 'Soil Health Card Scheme',
    titleHi: 'मृदा स्वास्थ्य कार्ड योजना',
    titleGu: 'જમીન આરોગ્ય કાર્ડ યોજના',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Soil & Nutrient',
    benefitAmount: 'Free soil testing & customized 12-parameter nutrient report',
    eligibility: {
      minLandSize: 0,
      maxLandSize: 50,
      applicableStates: [],
      applicableCrops: [],
      summary: 'All farmers owning or cultivating agricultural land across all states.',
      documentsRequired: ['Aadhaar Card', 'Khasra / Khatauni land number'],
    },
    applicationUrl: 'https://soilhealth.dac.gov.in',
    description: 'Government issues soil cards containing crop-wise recommendations of dosage of nutrients and fertilizers required for the individual farm to lower input costs and boost yield.',
  },
  {
    title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    titleHi: 'कृषि यंत्रीकरण पर उप-मिशन (एसएमएएम)',
    titleGu: 'કૃષિ યાંત્રિકીકરણ સબ-મિશન (ટ્રેક્ટર અને કૃષિ સાધનો સબસિડી)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Machinery & Equipment',
    benefitAmount: '40% to 50% subsidy on Tractors, Rotavators, Harvesters, and Laser Levellers',
    eligibility: {
      minLandSize: 1,
      maxLandSize: 50,
      applicableStates: [],
      applicableCrops: [],
      summary: 'Small, marginal, SC/ST and women farmers receive priority and higher subsidy percentage.',
      documentsRequired: ['Aadhaar Card', 'Land Record', 'Bank Passbook', 'Quotation from authorized implement dealer'],
    },
    applicationUrl: 'https://agrimachinery.nic.in',
    description: 'Promotes agricultural mechanization among small and marginal farmers with direct subsidy assistance on purchase of tractors and modern agricultural machinery.',
  },
  {
    title: 'Paramparagat Krishi Vikas Yojana (PKVY - Organic Farming)',
    titleHi: 'परम्परागत कृषि विकास योजना (पीकेवीવાય)',
    titleGu: 'પરંપરાગત કૃષિ વિકાસ યોજના (ઓર્ગેનિક / પ્રાકૃતિક ખેતી)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Organic Farming',
    benefitAmount: '₹50,000 / hectare for 3 years (₹31,000 direct benefit for organic inputs)',
    eligibility: {
      minLandSize: 1,
      maxLandSize: 5,
      applicableStates: [],
      applicableCrops: [],
      summary: 'Farmer clusters adopting PGS-India organic certification standards.',
      documentsRequired: ['Cluster Group Registration', 'Aadhaar Card', 'Land RoR'],
    },
    applicationUrl: 'https://pgsindia-ncof.gov.in',
    description: 'Financial assistance of ₹50,000 per hectare is provided for cluster-based organic farming, organic seed production, biological pest management, and marketing certification.',
  },
];

class SchemeService {
  /**
   * Seed default schemes if database collection is empty
   */
  async ensureSeed() {
    const count = await Scheme.countDocuments();
    if (count === 0) {
      await Scheme.insertMany(INITIAL_SCHEMES);
      logger.info('Government schemes seeded successfully');
    }
  }

  /**
   * Fetch all schemes with optional user profile eligibility matching
   */
  async getSchemes({ category, user, bookmarkedOnly, search }) {
    await this.ensureSeed();

    const query = {};
    if (category && category !== 'All') query.category = category;
    if (bookmarkedOnly && user?._id) query.bookmarkedBy = user._id;
    if (search) {
      query.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { titleHi: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const schemes = await Scheme.find(query).sort({ createdAt: 1 }).lean();

    // Match eligibility against user profile (farm size, state)
    const userFarmSize = user?.farmSize || 2.5; // default sample 2.5 acres if not set
    const userState = user?.state || '';

    return schemes.map((s) => {
      let isEligible = true;
      let eligibilityReason = 'Meets standard holding criteria';

      if (userFarmSize < s.eligibility.minLandSize) {
        isEligible = false;
        eligibilityReason = `Requires min ${s.eligibility.minLandSize} acres (Your farm: ${userFarmSize} acres)`;
      } else if (userFarmSize > s.eligibility.maxLandSize) {
        isEligible = false;
        eligibilityReason = `Capped at max ${s.eligibility.maxLandSize} acres (Your farm: ${userFarmSize} acres)`;
      }

      if (s.eligibility.applicableStates?.length && userState) {
        if (!s.eligibility.applicableStates.includes(userState)) {
          isEligible = false;
          eligibilityReason = `Applicable in selected states only`;
        }
      }

      const isBookmarked = Boolean(user?._id && s.bookmarkedBy?.some((id) => id.toString() === user._id.toString()));

      return {
        ...s,
        isEligible,
        eligibilityReason,
        isBookmarked,
      };
    });
  }

  /**
   * Toggle bookmark status for a scheme
   */
  async toggleBookmark(schemeId, userId) {
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) throw new Error('Scheme not found');

    const index = scheme.bookmarkedBy.findIndex((id) => id.toString() === userId.toString());
    const isBookmarked = index === -1;

    if (isBookmarked) {
      scheme.bookmarkedBy.push(userId);
    } else {
      scheme.bookmarkedBy.splice(index, 1);
    }

    await scheme.save();
    return { isBookmarked };
  }
}

export default new SchemeService();
