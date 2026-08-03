export const calculateFarmingImpact = (temp, humidity, rainChance) => {
  return [
    { 
      label: "Irrigation Need", 
      value: temp > 30 && rainChance < 20 ? "High" : "Low", 
      pct: temp > 30 ? 80 : 20, 
      color: "#1565C0" 
    },
    { 
      label: "Spray Window", 
      value: rainChance > 50 ? "Poor" : "Excellent", 
      pct: rainChance > 50 ? 10 : 90, 
      color: "#2E7D32" 
    },
    { 
      label: "Harvest Risk", 
      value: rainChance > 70 ? "Critical" : "Safe", 
      pct: rainChance, 
      color: "#E53935" 
    }
  ];
};