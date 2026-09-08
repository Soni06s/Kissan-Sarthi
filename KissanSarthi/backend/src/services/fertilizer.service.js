import fertilizerRepository from '../repositories/fertilizer.repository.js';
import geminiService from './gemini.service.js';
import logger from '../config/logger.js';

const CROP_TARGET_NPK = {
  wheat: { n: 120, p: 60, k: 40 },
  rice: { n: 100, p: 50, k: 50 },
  maize: { n: 150, p: 75, k: 50 },
  mustard: { n: 80, p: 40, k: 40 },
  potato: { n: 180, p: 100, k: 120 },
};

const STAGE_DISTRIBUTION = {
  sowing: { n: 0.25, p: 1.0, k: 0.5 },
  vegetative: { n: 0.5, p: 0.0, k: 0.25 },
  flowering: { n: 0.25, p: 0.0, k: 0.25 },
};

class FertilizerService {
  async calculate({ crop = 'wheat', stage = 'sowing', soilPH = 6.8, deficiency = 'none', targetNPK = null, location, userId }) {
    const cleanCrop = crop.toLowerCase();
    const cleanStage = stage.toLowerCase();
    const ph = parseFloat(soilPH) || 6.8;

    const baseNPK = targetNPK || CROP_TARGET_NPK[cleanCrop] || CROP_TARGET_NPK.wheat;
    const distribution = STAGE_DISTRIBUTION[cleanStage] || STAGE_DISTRIBUTION.sowing;

    // Deficit multipliers
    let nMult = 1.0;
    let pMult = 1.0;
    let kMult = 1.0;

    if (deficiency === 'nitrogen') nMult = 1.25;
    if (deficiency === 'phosphorus') pMult = 1.2;
    if (deficiency === 'potassium') kMult = 1.2;

    const reqN = Math.round(baseNPK.n * distribution.n * nMult);
    const reqP = Math.round(baseNPK.p * distribution.p * pMult);
    const reqK = Math.round(baseNPK.k * distribution.k * kMult);

    // Exact fertilizer weights (Urea = 46% N, DAP = 18% N & 46% P, MOP = 60% K)
    const dapKg = Math.round((reqP / 0.46) * 0.4); // acre basis
    const nFromDAP = Math.round(dapKg * 0.18);
    const remN = Math.max(reqN - nFromDAP, 0);
    const ureaKg = Math.round((remN / 0.46) * 0.4);
    const mopKg = Math.round(((reqK / 0.6) * 0.4));

    const totalCost = Math.round(ureaKg * 7 + dapKg * 27 + mopKg * 34);

    let soilPHNote = 'Soil pH is in optimal range (6.2 - 7.5).';
    if (ph < 6.0) {
      soilPHNote = `Soil pH (${ph}) is acidic. Apply Agricultural Lime (Calcium Carbonate) @ 200 kg/acre.`;
    } else if (ph > 7.8) {
      soilPHNote = `Soil pH (${ph}) is alkaline. Apply Gypsum @ 150 kg/acre or Sulphur to improve nutrient availability.`;
    }

    let defaultSchedule = cleanStage === 'sowing'
      ? 'Apply full DAP and MOP at sowing in furrows. Apply 1/3rd Urea at sowing.'
      : cleanStage === 'vegetative'
        ? 'Top dress remaining Urea after irrigation at 21-25 days.'
        : 'Apply final split of Urea during booting/flowering stage.';

    // Enhance schedule and agronomic context with Gemini AI
    try {
      const aiExplanation = await geminiService.explainFertilizerPlan({
        crop: cleanCrop,
        stage: cleanStage,
        soilPH: ph,
        deficiency,
        reqN,
        reqP,
        reqK,
        ureaKg,
        dapKg,
        mopKg,
        location,
      });

      if (aiExplanation) {
        if (aiExplanation.schedule) defaultSchedule = aiExplanation.schedule;
        if (aiExplanation.soilPHNote) soilPHNote = aiExplanation.soilPHNote;
      }
    } catch (err) {
      logger.warn(`Gemini fertilizer contextualization warning: ${err.message}`);
    }

    const recommendation = {
      primary: `Urea (${ureaKg} kg/acre) + DAP (${dapKg} kg/acre)`,
      dose: `Urea: ${ureaKg} kg | DAP: ${dapKg} kg | MOP: ${mopKg} kg per acre`,
      secondary: mopKg > 0 ? `Muriate of Potash (MOP): ${mopKg} kg/acre` : 'Zinc Sulphate: 10 kg/acre',
      schedule: defaultSchedule,
      cost: `₹${totalCost.toLocaleString('en-IN')}/acre`,
      npk: [reqN, reqP, reqK],
      soilPHNote,
    };

    const saved = await fertilizerRepository.create({
      user: userId,
      crop: cleanCrop,
      stage: cleanStage,
      soilPH: ph,
      deficiency,
      recommendation,
    });

    return {
      ...recommendation,
      id: saved._id,
    };
  }

  getHistory(userId) {
    return fertilizerRepository.findByUser(userId);
  }
}

export default new FertilizerService();
