import cropRepository from '../repositories/crop.repository.js';
import geminiService from './gemini.service.js';
import logger from '../config/logger.js';

const CROP_DATABASE = [
  {
    crop: 'Rice (Paddy)',
    variety: 'IR-64, Swarna, Basmati-370',
    seasons: ['kharif'],
    soils: ['loamy', 'clay'],
    tempRange: [20, 38],
    phRange: [5.5, 7.5],
    rainfallRange: [150, 350],
    nRange: [80, 150],
    yieldEst: '5.5 ton/ha',
    time: '120-135 days',
    tips: ['Maintain 3-5cm water level during tillering', 'Apply Nitrogen in 3 split doses', 'Watch for leaf blast disease'],
  },
  {
    crop: 'Wheat',
    variety: 'HD-2967, PBW-343, WH-1105',
    seasons: ['rabi'],
    soils: ['loamy', 'sandy loam'],
    tempRange: [12, 28],
    phRange: [6.0, 7.5],
    rainfallRange: [50, 150],
    nRange: [100, 140],
    yieldEst: '4.8 ton/ha',
    time: '120-150 days',
    tips: ['First irrigation at Crown Root Initiation (21 DAS)', 'Apply Zinc Sulphate @ 25kg/ha', 'Ensure weed-free field for first 45 days'],
  },
  {
    crop: 'Mustard',
    variety: 'Pusa Bold, RH-749, Giriraj',
    seasons: ['rabi'],
    soils: ['sandy', 'loamy'],
    tempRange: [15, 28],
    phRange: [6.0, 8.0],
    rainfallRange: [25, 100],
    nRange: [40, 80],
    yieldEst: '2.2 ton/ha',
    time: '110-130 days',
    tips: ['Apply Sulphur @ 20kg/ha for high oil content', 'Protect from Aphids using Neem oil spray', 'Irrigate at flowering and pod formation'],
  },
  {
    crop: 'Maize (Corn)',
    variety: 'DHM-117, NK-6240, HQPM-1',
    seasons: ['kharif', 'zaid'],
    soils: ['loamy', 'sandy'],
    tempRange: [18, 35],
    phRange: [5.8, 7.8],
    rainfallRange: [80, 200],
    nRange: [100, 160],
    yieldEst: '5.0 ton/ha',
    time: '90-110 days',
    tips: ['Ensure good field drainage', 'Top dress Urea at knee-high stage', 'Monitor for Fall Armyworm'],
  },
  {
    crop: 'Groundnut',
    variety: 'TG-26, JL-24, Kadiri-6',
    seasons: ['kharif', 'zaid'],
    soils: ['sandy', 'loamy'],
    tempRange: [22, 35],
    phRange: [6.0, 7.5],
    rainfallRange: [50, 125],
    nRange: [20, 40],
    yieldEst: '2.8 ton/ha',
    time: '100-115 days',
    tips: ['Apply Gypsum @ 400kg/ha at pegging stage', 'Inoculate seed with Rhizobium culture', 'Avoid waterlogging'],
  },
];

class CropService {
  async recommend({ soilType, season, nitrogen = 80, temperature = 25, rainfall = 120, ph = 6.8, location, userId }) {
    const cleanSeason = (season || 'kharif').toLowerCase();
    const cleanSoil = (soilType || 'loamy').toLowerCase();

    // 1. Primary: Use Gemini AI Engine for dynamic ICAR-grounded recommendation
    try {
      const aiResult = await geminiService.generateCropRecommendation({
        soilType: cleanSoil,
        season: cleanSeason,
        nitrogen,
        temperature,
        rainfall,
        ph,
        location,
      });

      if (aiResult && aiResult.recommendedCrop) {
        const saved = await cropRepository.create({
          user: userId,
          recommendedCrop: aiResult.recommendedCrop,
          variety: aiResult.variety,
          yield: aiResult.yield,
          confidence: aiResult.confidence || 92,
          time: aiResult.time,
          tips: aiResult.tips || [],
          soilType: cleanSoil,
          season: cleanSeason,
          nitrogen,
          temperature,
          rainfall,
        });

        return {
          crop: saved.recommendedCrop,
          recommendedCrop: saved.recommendedCrop,
          variety: saved.variety,
          yield: saved.yield,
          confidence: saved.confidence,
          time: saved.time,
          tips: saved.tips,
          id: saved._id,
        };
      }
    } catch (err) {
      logger.warn(`Gemini Crop recommendation error, engaging agronomic fallback: ${err.message}`);
    }

    // 2. Secondary: Dynamic Agronomic Rule Engine
    let bestMatch = CROP_DATABASE[0];
    let highestScore = -1;

    for (const crop of CROP_DATABASE) {
      let score = 0;
      if (crop.seasons.includes(cleanSeason)) score += 30;
      if (crop.soils.some((s) => cleanSoil.includes(s) || s.includes(cleanSoil))) score += 25;
      if (temperature >= crop.tempRange[0] && temperature <= crop.tempRange[1]) score += 15;
      if (ph >= crop.phRange[0] && ph <= crop.phRange[1]) score += 15;
      if (rainfall >= crop.rainfallRange[0] && rainfall <= crop.rainfallRange[1]) score += 15;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = crop;
      }
    }

    const confidence = Math.min(Math.max(highestScore, 75), 95);

    const recommendationData = {
      user: userId,
      recommendedCrop: bestMatch.crop,
      variety: bestMatch.variety,
      yield: bestMatch.yieldEst,
      confidence,
      time: bestMatch.time,
      tips: bestMatch.tips,
      soilType: cleanSoil,
      season: cleanSeason,
      nitrogen,
      temperature,
      rainfall,
    };

    const saved = await cropRepository.create(recommendationData);

    return {
      crop: saved.recommendedCrop,
      recommendedCrop: saved.recommendedCrop,
      variety: saved.variety,
      yield: saved.yield,
      confidence: saved.confidence,
      time: bestMatch.time,
      tips: saved.tips,
      id: saved._id,
    };
  }

  getHistory(userId) {
    return cropRepository.findByUser(userId);
  }
}

export default new CropService();
