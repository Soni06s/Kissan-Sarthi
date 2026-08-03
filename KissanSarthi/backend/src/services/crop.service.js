import cropRepository from '../repositories/crop.repository.js';

const CROP_RULES = {
  kharif: {
    loamy: {
      recommendedCrop: 'Rice (Paddy)',
      variety: 'IR-64, Swarna',
      yield: '5-6 ton/ha',
      confidence: 92,
      time: '110-130 days',
      tips: ['Transplant in flooded fields', 'Apply 120kg N/ha', 'Control weevils with Chlorpyrifos'],
    },
    sandy: {
      recommendedCrop: 'Groundnut',
      variety: 'TG-26, JL-24',
      yield: '2-3 ton/ha',
      confidence: 88,
      time: '100-110 days',
      tips: ['Sandy loam is ideal', 'Apply gypsum 400kg/ha', 'Inoculate seeds with Rhizobium'],
    },
    clay: {
      recommendedCrop: 'Cotton',
      variety: 'H-777, RCH-2',
      yield: '3-4 ton/ha',
      confidence: 85,
      time: '150-180 days',
      tips: ['Ensure proper drainage', 'Apply balanced NPK', 'Monitor for bollworm'],
    },
  },
  rabi: {
    loamy: {
      recommendedCrop: 'Wheat',
      variety: 'HD-2967, PBW-343',
      yield: '4-5 ton/ha',
      confidence: 95,
      time: '120-150 days',
      tips: ['Sow Oct-Nov', 'First irrigation at 21 days', 'Apply 120kg N/ha in splits'],
    },
    sandy: {
      recommendedCrop: 'Mustard',
      variety: 'Pusa Bold, RH-749',
      yield: '1.5-2 ton/ha',
      confidence: 87,
      time: '110-130 days',
      tips: ['Sow in rows 30cm apart', 'Apply sulphur 20kg/ha', 'Irrigate at flowering'],
    },
    clay: {
      recommendedCrop: 'Barley',
      variety: 'RD-2786, BH-902',
      yield: '3-4 ton/ha',
      confidence: 90,
      time: '120-140 days',
      tips: ['Sow early Nov', 'Light irrigation at crown root', 'Watch for rust disease'],
    },
  },
  zaid: {
    loamy: {
      recommendedCrop: 'Maize',
      variety: 'DHM-117, NK-6240',
      yield: '4-5 ton/ha',
      confidence: 89,
      time: '90-110 days',
      tips: ['Ensure adequate irrigation', 'Apply 150kg N/ha', 'Control stem borer early'],
    },
    sandy: {
      recommendedCrop: 'Watermelon',
      variety: 'Sugar Baby, Asahi',
      yield: '20-25 ton/ha',
      confidence: 84,
      time: '80-90 days',
      tips: ['Drip irrigation recommended', 'Mulch to retain moisture', 'Harvest at maturity'],
    },
    clay: {
      recommendedCrop: 'Moong (Green Gram)',
      variety: 'Pusa Vishal, K-851',
      yield: '0.8-1 ton/ha',
      confidence: 86,
      time: '60-70 days',
      tips: ['Short duration crop', 'Rhizobium inoculation', 'Minimal irrigation needed'],
    },
  },
};

class CropService {
  recommend({ soilType, season, nitrogen, temperature, rainfall, userId }) {
    const base = CROP_RULES[season]?.[soilType] || CROP_RULES.kharif.loamy;

    let confidence = base.confidence;
    if (temperature >= 15 && temperature <= 35) confidence += 2;
    if (rainfall >= 100 && rainfall <= 300) confidence += 2;
    if (nitrogen >= 40 && nitrogen <= 120) confidence += 1;
    confidence = Math.min(confidence, 99);

    const result = {
      recommendedCrop: base.recommendedCrop,
      variety: base.variety,
      yield: base.yield,
      confidence,
      tips: base.tips,
      soilType,
      season,
      nitrogen,
      temperature,
      rainfall,
    };

    return cropRepository.create({ ...result, user: userId }).then((saved) => ({
      crop: saved.recommendedCrop,
      variety: saved.variety,
      yield: saved.yield,
      confidence: saved.confidence,
      time: base.time,
      tips: saved.tips,
      id: saved._id,
    }));
  }

  getHistory(userId) {
    return cropRepository.findByUser(userId);
  }
}

export default new CropService();
