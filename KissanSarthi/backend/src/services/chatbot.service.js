import chatRepository from '../repositories/chat.repository.js';
import User from '../models/User.js';
import sensorRepository from '../repositories/sensor.repository.js';
import weatherRepository from '../repositories/weather.repository.js';
import geminiService from './gemini.service.js';
import logger from '../config/logger.js';

const KNOWLEDGE_RESPONSES = {
  wheat: '🌾 Wheat grows best in cool, dry climates (15-20°C) with well-drained loamy soil. Optimal sowing is Oct-Nov. Recommend HD-2967, PBW-343 or DBW-187 varieties. Irrigate at CRI stage (21 days).',
  rice: '🌾 Rice requires a warm, humid climate (20-37°C) with clayey or alluvial soil. Sowing: June-July. Maintain 3-5cm water depth during active tillering.',
  fertilizer: '💊 Standard NPK ratio: 4:2:1 for cereals. Apply full DAP and MOP at sowing, followed by Urea top-dressing at 21 DAS and panicle initiation.',
  pest: '🐛 For sucking pests: Spray Neem-oil (10,000 ppm) or Imidacloprid (0.3ml/L). For fungal blights, apply Mancozeb 75% WP @ 2g/L water in early morning.',
  price: '📊 Mandi Trends: Wheat ₹2,480/q, Rice ₹3,200/q, Mustard ₹5,800/q. Check the Market Prices tab for live arrivals in your district.',
  scheme: '📜 Govt Schemes: PM-KISAN provides ₹6,000/year in 3 installments. KCC (Kisan Credit Card) offers 4% subsidized crop loans with timely repayment.',
  default: "🤖 Namaste! I'm KissanBot, your Gemini AI agricultural assistant. Ask me about crop rotation, fertilizers, pest control, weather impact, or government schemes.",
};

class ChatbotService {
  async chat(userId, question) {
    let answer = null;

    // 1. Gather User Context & History
    let userContext = {};
    let recentHistory = [];

    try {
      if (userId) {
        const [user, history, latestSensor] = await Promise.all([
          User.findById(userId).select('name location city state farmSize'),
          chatRepository.findByUser(userId),
          sensorRepository.findLatestByFarmer(userId),
        ]);

        if (user) {
          const loc = user.city ? `${user.city}, ${user.state || ''}` : (user.location || '');
          userContext = {
            name: user.name,
            location: loc,
            farmSize: user.farmSize,
            sensorData: latestSensor ? { soilMoisture: latestSensor.soilMoisture, temperature: latestSensor.temperature, ph: latestSensor.ph } : null,
          };
        }
        recentHistory = (history || []).slice(-4);
      }
    } catch (ctxErr) {
      logger.warn(`Failed to gather user context for chat: ${ctxErr.message}`);
    }

    // 2. Query Gemini AI Engine
    try {
      answer = await geminiService.generateChatResponse({
        history: recentHistory,
        userMessage: question,
        userContext,
      });
    } catch (err) {
      logger.error(`Gemini Chatbot API error: ${err.message}`);
      answer = this.generateStructuredReply(question);
    }

    if (!answer) {
      answer = this.generateStructuredReply(question);
    }

    let recordId = null;
    let timestamp = new Date();
    if (userId) {
      try {
        const record = await chatRepository.create({ user: userId, question, answer });
        recordId = record?._id;
        timestamp = record?.createdAt || record?.timestamp || timestamp;
      } catch (repoErr) {
        logger.warn(`Could not save chat history: ${repoErr.message}`);
      }
    }

    return { reply: answer, id: recordId, timestamp };
  }

  generateStructuredReply(message) {
    const m = (message || '').toLowerCase();
    if (m.includes('wheat') || m.includes('गेहूं')) return KNOWLEDGE_RESPONSES.wheat;
    if (m.includes('rice') || m.includes('paddy') || m.includes('धान')) return KNOWLEDGE_RESPONSES.rice;
    if (m.includes('fertilizer') || m.includes('urea') || m.includes('dap') || m.includes('खाद')) return KNOWLEDGE_RESPONSES.fertilizer;
    if (m.includes('pest') || m.includes('disease') || m.includes('insect') || m.includes('कीट')) return KNOWLEDGE_RESPONSES.pest;
    if (m.includes('price') || m.includes('market') || m.includes('mandi') || m.includes('भाव')) return KNOWLEDGE_RESPONSES.price;
    if (m.includes('scheme') || m.includes('yojana') || m.includes('pm-kisan') || m.includes('kcc')) return KNOWLEDGE_RESPONSES.scheme;
    return KNOWLEDGE_RESPONSES.default;
  }

  async getHistory(userId) {
    const history = await chatRepository.findByUser(userId);
    return history.reverse();
  }
}

export default new ChatbotService();
