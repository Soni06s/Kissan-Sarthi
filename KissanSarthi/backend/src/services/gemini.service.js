import crypto from 'crypto';
import logger from '../config/logger.js';

class GeminiService {
  constructor() {
    this.model = 'gemini-2.5-flash';
    this.cache = new Map();
    this.cacheTTL = 30 * 60 * 1000; // 30 minutes in-memory cache
  }

  getApiKey() {
    return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_KEY || '';
  }

  getCacheKey(prefix, data) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return `${prefix}:${crypto.createHash('md5').update(serialized).digest('hex')}`;
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  setCache(key, value) {
    // Keep cache size bounded
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  async callGeminiRaw({ contents, systemInstruction, temperature = 0.2, responseMimeType = null }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in backend environment.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const body = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 4096,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    if (responseMimeType) {
      body.generationConfig.responseMimeType = responseMimeType;
    }

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const msg = errorData.error?.message || `Gemini API error (HTTP ${res.status})`;
      logger.error(`Gemini call error: ${msg}`);
      throw new Error(msg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    return text.trim();
  }

  async generateStructuredJson({ prompt, systemInstruction, cachePrefix = 'json' }) {
    const cacheKey = this.getCacheKey(cachePrefix, prompt);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const fullSystemInstruction = `${systemInstruction || 'You are an agricultural AI system.'}\nIMPORTANT: Output valid JSON only, without markdown wrapping or backticks. Follow the requested JSON schema exactly.`;

    const raw = await this.callGeminiRaw({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: fullSystemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.2,
    });

    let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      logger.warn(`Failed to parse structured JSON directly from Gemini: ${err.message}. Raw: ${raw.slice(0, 100)}`);
      // Try regex extraction of first JSON block
      const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Gemini output could not be parsed as valid JSON.');
      }
    }

    this.setCache(cacheKey, parsed);
    return parsed;
  }

  async generateChatResponse({ history = [], userMessage, userContext = {} }) {
    const farmContext = [
      userContext.location ? `Farmer Location: ${userContext.location}` : '',
      userContext.name ? `Farmer Name: ${userContext.name}` : '',
      userContext.farmSize ? `Farm Size: ${userContext.farmSize} acres` : '',
      userContext.currentWeather ? `Current Weather: ${JSON.stringify(userContext.currentWeather)}` : '',
      userContext.sensorData ? `Recent Field Sensors: ${JSON.stringify(userContext.sensorData)}` : '',
    ].filter(Boolean).join('\n');

    const systemInstruction = `You are KissanBot, a knowledgeable, empathetic, and practical AI agricultural advisor for Indian farmers.
Scope: Crop care, soil nutrient management, weather impact, pest/disease remedies, mandi prices, and government agriculture schemes (PM-KISAN, KCC, Fasal Bima).
Tone: Respectful ("Namaste"), concise, highly practical, actionable. Provide concrete steps, doses in kg/acre or g/L, and timings.
${farmContext ? `Current Farm Profile:\n${farmContext}` : ''}
Reply clearly in 2-4 short bullet points or concise paragraphs. Always reply in the exact same language (Hindi, Gujarati, English, or Hinglish) in which the farmer asks their question.`;

    const contents = [];

    // Include recent history (last 4 turns)
    if (Array.isArray(history)) {
      const recent = history.slice(-4);
      for (const h of recent) {
        if (h.question) {
          contents.push({ role: 'user', parts: [{ text: h.question }] });
        }
        if (h.answer) {
          contents.push({ role: 'model', parts: [{ text: h.answer }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    return this.callGeminiRaw({
      contents,
      systemInstruction,
      temperature: 0.4,
    });
  }

  async generateCropRecommendation({ soilType, season, nitrogen, temperature, rainfall, ph = 6.8, location }) {
    const prompt = `Act as an expert agronomist. Recommend the best high-yield crop for an Indian farmer with these parameters:
Location: ${location || 'India'}
Soil Type: ${soilType}
Crop Season: ${season}
Nitrogen Level: ${nitrogen} kg/ha
Avg Temperature: ${temperature}°C
Annual/Seasonal Rainfall: ${rainfall} mm
Soil pH: ${ph}

Respond with valid JSON adhering to this exact schema:
{
  "recommendedCrop": "Name of crop (e.g. Wheat, Rice, Mustard, Cotton, Maize, Groundnut, Soybean)",
  "variety": "Specific high-yield ICAR/state varieties",
  "yield": "Estimated yield in ton/ha (e.g. '4.8 ton/ha')",
  "confidence": 92,
  "time": "Growth duration in days (e.g. '120-140 days')",
  "tips": [
    "Specific actionable tip 1",
    "Specific actionable tip 2",
    "Specific actionable tip 3"
  ]
}`;
    const result = await this.generateStructuredJson({
      prompt,
      systemInstruction: 'You are an ICAR-certified agronomy specialist. Always provide realistic varieties and cultivation advice for Indian agro-climatic zones.',
      cachePrefix: 'crop_rec',
    });

    // Ensure confidence is numeric
    if (typeof result.confidence === 'string') {
      const num = parseInt(result.confidence);
      result.confidence = isNaN(num) ? 90 : num;
    }
    if (typeof result.tips === 'string') {
      result.tips = [result.tips];
    }
    return result;
  }

  async explainFertilizerPlan({ crop, stage, soilPH, deficiency, reqN, reqP, reqK, ureaKg, dapKg, mopKg, location }) {
    const prompt = `A farmer in ${location || 'India'} is cultivating ${crop} at ${stage} stage with soil pH ${soilPH} and ${deficiency !== 'none' ? `${deficiency} deficiency` : 'no major deficiency'}.
The calculated requirement is N: ${reqN} kg/ha, P: ${reqP} kg/ha, K: ${reqK} kg/ha.
Dosage: Urea: ${ureaKg} kg/acre, DAP: ${dapKg} kg/acre, MOP: ${mopKg} kg/acre.

Respond with valid JSON:
{
  "schedule": "Concise step-by-step split application schedule (when and how to apply)",
  "soilPHNote": "Practical guidance on managing soil pH ${soilPH} for ${crop}",
  "precautions": ["Precaution 1", "Precaution 2"]
}`;
    return this.generateStructuredJson({
      prompt,
      systemInstruction: 'You are an agricultural soil chemistry and fertilizer specialist.',
      cachePrefix: 'fert_plan',
    });
  }

  async generateDashboardTips({ location, weather, sensorData }) {
    const prompt = `Provide 3 personalized, timely farming tips for an Indian farmer:
Location: ${location || 'India'}
Current Weather: ${weather ? `${weather.temperature}°C, ${weather.condition}, humidity ${weather.humidity || 50}%` : 'Normal seasonal weather'}
Current Soil Readings: ${sensorData ? `Moisture: ${sensorData.soilMoisture}%, pH: ${sensorData.ph || 6.8}` : 'Optimal'}

Respond with valid JSON:
[
  { "title": "Hydration / Irrigation", "description": "Actionable advice based on weather and soil" },
  { "title": "Crop Protection / Spraying", "description": "Pest or disease prevention tip" },
  { "title": "Nutrient / Field Management", "description": "Soil or agronomic recommendation" }
]`;
    return this.generateStructuredJson({
      prompt,
      systemInstruction: 'You are a senior Indian agricultural consultant.',
      cachePrefix: 'dash_tips',
    });
  }

  async checkHealth() {
    const start = Date.now();
    try {
      const res = await this.callGeminiRaw({
        contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }],
        temperature: 0.1,
      });
      const latency = Date.now() - start;
      return { 
        status: 'on', 
        latency, 
        message: 'Operational · Responsive',
        rawError: null 
      };
    } catch (err) {
      const latency = Date.now() - start;
      const rawMsg = err.message || 'Unknown service error';
      let cleanMsg = 'Service temporarily degraded';
      let status = 'warn';

      if (/quota|429|exhausted|resource_exhausted|rate limit/i.test(rawMsg)) {
        cleanMsg = 'Rate limit reached — retries in ~1 min';
        status = 'warn';
      } else if (/key|401|403|unauthorized|permission/i.test(rawMsg)) {
        cleanMsg = 'API key invalid or unauthorized';
        status = 'off';
      } else if (/timeout|econnrefused|econnreset|network/i.test(rawMsg)) {
        cleanMsg = 'Connection timeout — reconnecting';
        status = 'warn';
      }

      return {
        status,
        latency,
        message: cleanMsg,
        rawError: rawMsg,
      };
    }
  }
}

export default new GeminiService();
