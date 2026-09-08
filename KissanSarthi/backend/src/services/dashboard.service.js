import sensorRepository from '../repositories/sensor.repository.js';
import weatherRepository from '../repositories/weather.repository.js';
import marketRepository from '../repositories/market.repository.js';
import alertRepository from '../repositories/alert.repository.js';
import cropRepository from '../repositories/crop.repository.js';
import geminiService from './gemini.service.js';
import { DEFAULT_MANDI } from '../config/constants.js';
import { formatRelativeTime } from '../utils/helpers.js';
import logger from '../config/logger.js';

class DashboardService {
  async getSummary(user) {
    const farmerId = user._id;
    const location = user.city ? `${user.city}, ${user.state || ''}` : (user.location || 'Your Farm');
    const mandiName = user.city ? `${user.city} Mandi` : (user.location ? `${user.location.split(',')[0].trim()} Mandi` : DEFAULT_MANDI);

    const [latestSensor, latestWeather, wheatPrice, priceHistory, soilHistory, alerts, latestCrop] =
      await Promise.all([
        sensorRepository.findLatestByFarmer(farmerId),
        weatherRepository.findLatestByLocation(location),
        marketRepository.findLatestByCommodity('Wheat', mandiName).then(res => res || marketRepository.findLatestByCommodity('Wheat')),
        marketRepository.findByCommodity('Wheat', mandiName, 14).then(res => (res && res.length) ? res : marketRepository.findByCommodity('Wheat', null, 14)),
        sensorRepository.findByFarmer(farmerId, 14),
        alertRepository.findByUser(farmerId),
        cropRepository.findByUser(farmerId, 1),
      ]);

    const temp = latestSensor?.temperature ?? latestWeather?.temperature ?? 28;
    const moisture = latestSensor?.soilMoisture ?? 64;
    const marketPrice = wheatPrice?.price ?? 2480;
    const prevPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : marketPrice;
    const priceChange = prevPrice ? (((marketPrice - prevPrice) / prevPrice) * 100).toFixed(1) : 0;

    // Generate dynamic AI Insights via Gemini
    let tips = [];
    try {
      tips = await geminiService.generateDashboardTips({
        location,
        weather: latestWeather,
        sensorData: latestSensor,
      });
    } catch (err) {
      logger.warn(`Gemini dashboard tips generation warning: ${err.message}`);
    }

    if (!Array.isArray(tips) || tips.length === 0) {
      if (latestCrop?.[0]?.tips?.length) {
        tips = latestCrop[0].tips.slice(0, 3).map((t, i) => ({
          title: ['Targeted Yield Strategy', 'Irrigation Timing', 'Pest Surveillance'][i] || 'Field Advice',
          description: t,
        }));
      } else {
        tips = [
          { title: 'Irrigation Scheduling', description: moisture < 50 ? 'Soil moisture is low. Schedule morning drip irrigation to prevent root stress.' : 'Soil moisture levels are within optimal range for current stage.' },
          { title: 'Nutrient Timing', description: 'Monitor crop foliage for nitrogen yellowing; apply top dressing after light irrigation.' },
          { title: 'Crop Protection', description: temp > 32 ? 'High heat conditions. Check undersides of leaves for sucking pest activity.' : 'Optimal climate conditions for balanced vegetative development.' },
        ];
      }
    }

    return {
      user: { name: user.name, location },
      kpis: {
        temperature: {
          value: `${Math.round(temp)}\u00b0C`,
          trend: latestWeather ? `+${Math.round(temp - (latestWeather.temperature - 2))}\u00b0` : 'Live',
          sub: latestSensor ? `Node ${latestSensor.nodeId}` : 'Regional Climate',
        },
        soilMoisture: {
          value: `${Math.round(moisture)}%`,
          trend: moisture < 40 ? 'Low' : moisture > 80 ? 'Saturated' : 'Normal',
          sub: latestSensor ? `pH ${latestSensor.ph || 6.8}` : 'Field Sensor Node',
        },
        activeYield: {
          value: String(user.farmSize || 12.5),
          trend: 'Acres',
          sub: 'Operational Farm Area',
        },
        marketIndex: {
          value: `\u20b9${marketPrice.toLocaleString('en-IN')}`,
          trend: priceChange >= 0 ? `\u2191${priceChange}%` : `\u2193${Math.abs(priceChange)}%`,
          sub: wheatPrice?.mandi || mandiName,
        },
      },
      charts: {
        priceTrend: priceHistory.length > 0 ? priceHistory.map((p) => p.price) : [2300, 2350, 2400, 2380, 2420, 2450, 2480],
        soilMoistureTrend: soilHistory.length > 0 ? [...soilHistory].reverse().map((s) => s.soilMoisture) : [62, 65, 64, 66, 63, 64],
      },
      liveSensor: latestSensor
        ? {
            nodeId: latestSensor.nodeId,
            temperature: latestSensor.temperature,
            soilMoisture: latestSensor.soilMoisture,
            nitrogen: latestSensor.nitrogen,
            ph: latestSensor.ph,
            humidity: latestSensor.humidity,
            timestamp: latestSensor.timestamp,
          }
        : null,
      weather: latestWeather
        ? {
            temperature: latestWeather.temperature,
            condition: latestWeather.condition,
            humidity: latestWeather.humidity ? `${latestWeather.humidity}%` : '55%',
            windSpeed: latestWeather.windSpeed ? `${latestWeather.windSpeed} km/h` : '12 km/h',
            location,
          }
        : {
            temperature: Math.round(temp),
            condition: 'Clear Sky',
            humidity: '50%',
            windSpeed: '10 km/h',
            location,
          },
      alerts: alerts.slice(0, 5).map((a) => ({
        id: a._id,
        type: a.type || 'info',
        text: a.message || a.title,
        time: formatRelativeTime(a.createdAt),
        read: a.read,
      })),
      aiInsights: tips,
    };
  }

  async getLive(user) {
    const [latestSensor, latestWeather] = await Promise.all([
      sensorRepository.findLatestByFarmer(user._id),
      weatherRepository.findLatestByLocation(user.location),
    ]);

    return {
      sensor: latestSensor,
      weather: latestWeather,
      timestamp: new Date(),
    };
  }
}

export default new DashboardService();
