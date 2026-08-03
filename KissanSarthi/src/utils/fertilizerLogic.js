export const FERTILIZER_DATA = {
  wheat: {
    sowing: {
      primary: "DAP (18-46-0)",
      dose: "100 kg/ha",
      secondary: "MOP 40 kg/ha",
      schedule: "Apply at sowing time in furrows",
      cost: "₹3,200/acre"
    },
    vegetative: {
      primary: "Urea (46% N)",
      dose: "60 kg/ha",
      secondary: "Zinc Sulphate 25 kg/ha",
      schedule: "Top dressing at 21-25 days after sowing",
      cost: "₹900/acre"
    }
  },
  rice: {
    sowing: {
      primary: "NPK 14-35-14",
      dose: "150 kg/ha",
      secondary: "Urea 80 kg/ha",
      schedule: "Basal dose: 50% at transplanting",
      cost: "₹4,500/acre"
    },
    vegetative: {
      primary: "Urea (46% N)",
      dose: "100 kg/ha",
      secondary: "Potash 40 kg/ha",
      schedule: "Apply at active tillering stage",
      cost: "₹1,200/acre"
    }
  }
};

export const calculateNPK = (crop) => {
  // Standard N-P-K ratios for reporting
  const ratios = {
    wheat: [120, 60, 40],
    rice: [100, 50, 50],
    maize: [150, 75, 50]
  };
  return ratios[crop] || [120, 60, 40];
};