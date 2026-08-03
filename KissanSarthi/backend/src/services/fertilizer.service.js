import fertilizerRepository from '../repositories/fertilizer.repository.js';

const FERTILIZER_RULES = {
  wheat: {
    sowing: {
      primary: 'DAP (18-46-0)',
      dose: '100 kg/ha',
      secondary: 'MOP 40 kg/ha',
      schedule: 'Apply at sowing time in furrows',
      cost: '₹3,200/acre',
      npk: [18, 46, 0],
    },
    vegetative: {
      primary: 'Urea (46% N)',
      dose: '60 kg/ha',
      secondary: 'Zinc Sulphate 25 kg/ha',
      schedule: 'Top dressing at 21-25 DAS',
      cost: '₹900/acre',
      npk: [46, 0, 0],
    },
    flowering: {
      primary: 'Urea (46% N)',
      dose: '40 kg/ha',
      secondary: 'Boron 5 kg/ha',
      schedule: 'Apply at booting/flowering stage',
      cost: '₹700/acre',
      npk: [46, 0, 0],
    },
  },
  rice: {
    sowing: {
      primary: 'Complex 14-35-14',
      dose: '150 kg/ha',
      secondary: 'Urea 80 kg/ha',
      schedule: 'Split: 50% at transplanting, 50% at tillering',
      cost: '₹4,500/acre',
      npk: [14, 35, 14],
    },
    vegetative: {
      primary: 'Urea (46% N)',
      dose: '100 kg/ha',
      secondary: 'Potash 40 kg/ha',
      schedule: 'Apply at active tillering stage',
      cost: '₹1,200/acre',
      npk: [46, 0, 10],
    },
    flowering: {
      primary: 'Urea (46% N)',
      dose: '50 kg/ha',
      secondary: 'Zinc Sulphate 25 kg/ha',
      schedule: 'Apply at panicle initiation',
      cost: '₹800/acre',
      npk: [46, 0, 0],
    },
  },
  maize: {
    sowing: {
      primary: 'DAP (18-46-0)',
      dose: '120 kg/ha',
      secondary: 'Urea 60 kg/ha',
      schedule: 'Basal application at sowing',
      cost: '₹3,800/acre',
      npk: [18, 46, 0],
    },
    vegetative: {
      primary: 'Urea (46% N)',
      dose: '80 kg/ha',
      secondary: 'MOP 30 kg/ha',
      schedule: 'Apply at knee-high stage',
      cost: '₹1,100/acre',
      npk: [46, 0, 0],
    },
    flowering: {
      primary: 'Urea (46% N)',
      dose: '40 kg/ha',
      secondary: 'Micronutrient mix',
      schedule: 'Apply at tasseling',
      cost: '₹650/acre',
      npk: [46, 0, 0],
    },
  },
};

const DEFICIENCY_ADJUSTMENTS = {
  nitrogen: { primary: 'Urea (46% N)', doseBoost: '20%' },
  phosphorus: { primary: 'DAP (18-46-0)', doseBoost: '15%' },
  potassium: { primary: 'MOP (0-0-60)', doseBoost: '15%' },
};

class FertilizerService {
  calculate({ crop, stage, soilPH, deficiency, userId }) {
    const base = FERTILIZER_RULES[crop]?.[stage] || FERTILIZER_RULES.wheat.sowing;
    const adjustment = DEFICIENCY_ADJUSTMENTS[deficiency];

    const recommendation = {
      primary: adjustment?.primary || base.primary,
      dose: base.dose,
      secondary: base.secondary,
      schedule: base.schedule,
      cost: base.cost,
      npk: base.npk,
      soilPHNote:
        soilPH < 6
          ? 'Soil is acidic. Consider lime application.'
          : soilPH > 7.5
            ? 'Soil is alkaline. Consider gypsum application.'
            : 'Soil pH is in optimal range.',
    };

    return fertilizerRepository
      .create({ user: userId, crop, stage, soilPH, deficiency, recommendation })
      .then((saved) => ({
        ...recommendation,
        id: saved._id,
      }));
  }

  getHistory(userId) {
    return fertilizerRepository.findByUser(userId);
  }
}

export default new FertilizerService();
