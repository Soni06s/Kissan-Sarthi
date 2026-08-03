const CHATBOT_RESPONSES = {
  wheat: "🌾 Wheat grows best in cool, dry climates (15-20°C). It needs loamy soil with good drainage. Sowing time: Oct-Dec. Expected yield: 4-6 tons/hectare.",
  rice: "🌾 Rice requires hot & humid climate (20-37°C). It grows best in clayey, waterlogged soil. Sowing time: June-July (Kharif).",
  fertilizer: "💊 For most crops: Use NPK 20-20-0 at sowing. Urea (46% N) as top dressing. Always do a soil test first!",
  pest: "🐛 For pest control: Use Neem-based organic pesticides. For fungal diseases, apply Mancozeb (0.25%). Spray in early morning or evening.",
  price: "📊 Mandi Trends: Wheat ₹2,150/q, Rice ₹3,200/q. Prices in Jammu/Samba are trending upward due to seasonal demand.",
  default: "🤖 Namaste! I'm KissanBot. Ask me about crops, fertilizers, pest control, or market prices in J&K."
};

export const getBotResponse = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes("wheat") || m.includes("गेहूं")) return CHATBOT_RESPONSES.wheat;
  if (m.includes("rice") || m.includes("paddy") || m.includes("धान")) return CHATBOT_RESPONSES.rice;
  if (m.includes("fertilizer") || m.includes("urea") || m.includes("खाद")) return CHATBOT_RESPONSES.fertilizer;
  if (m.includes("pest") || m.includes("disease") || m.includes("कीट")) return CHATBOT_RESPONSES.pest;
  if (m.includes("price") || m.includes("market") || m.includes("mandi")) return CHATBOT_RESPONSES.price;
  return CHATBOT_RESPONSES.default;
};