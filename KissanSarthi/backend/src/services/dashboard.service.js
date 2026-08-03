import sensorRepository from '../repositories/sensor.repository.js';
import weatherRepository from '../repositories/weather.repository.js';
import marketRepository from '../repositories/market.repository.js';
import alertRepository from '../repositories/alert.repository.js';
import cropRepository from '../repositories/crop.repository.js';
import { DEFAULT_MANDI } from '../config/constants.js';
import { formatRelativeTime } from '../utils/helpers.js';

class DashboardService {
  async getSummary(user) {
    const farmerId = user._id;
    const location = user.location || 'Bari Brahmana, J&K';

    const [latestSensor, latestWeather, wheatPrice, priceHistory, soilHistory, alerts, latestCrop] =
      await Promise.all([
        sensorRepository.findLatestByFarmer(farmerId),
        weatherRepository.findLatestByLocation(location),
        marketRepository.findLatestByCommodity('Wheat', DEFAULT_MANDI),
        marketRepository.findByCommodity('Wheat', DEFAULT_MANDI, 14),
        sensorRepository.findByFarmer(farmerId, 14),
        alertRepository.findByUser(farmerId),
        cropRepository.findByUser(farmerId, 1),
      ]);

    const temp = latestSensor?.temperature ?? latestWeather?.temperature ?? 28;
    const moisture = latestSensor?.soilMoisture ?? 64;
    const marketPrice = wheatPrice?.price ?? 2480;
    const prevPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : marketPrice;
    const priceChange = prevPrice ? (((marketPrice - prevPrice) / prevPrice) * 100).toFixed(1) : 0;

    return {
      user: { name: user.name, location },
      kpis: {
        temperature: {
          value: `${Math.round(temp)}\u00b0C`,
          trend: latestWeather ? `+${Math.round(temp - (latestWeather.temperature - 2))}\u00b0` : '+2\u00b0',
          sub: 'High UV Index',
        },
        soilMoisture: {
          value: `${Math.round(moisture)}%`,
          trend: moisture < 50 ? 'Critical' : 'Normal',
          sub: latestSensor ? `Node ${latestSensor.nodeId}` : 'Field Area #03',
        },
        activeYield: {
          value: String(user.farmSize || 14.2),
          trend: 'Acres',
          sub: '4 Crop Cycles',
        },
        marketIndex: {
          value: `\u20b9${marketPrice.toLocaleString('en-IN')}`,
          trend: priceChange >= 0 ? `\u2191${priceChange}%` : `\u2193${Math.abs(priceChange)}%`,
          sub: DEFAULT_MANDI,
        },
      },
      charts: {
        priceTrend: priceHistory.map((p) => p.price),
        soilMoistureTrend: [...soilHistory].reverse().map((s) => s.soilMoisture),
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
            location,
          }
        : null,
      alerts: alerts.slice(0, 5).map((a) => ({
        id: a._id,
        type: a.type,
        text: a.message,
        time: formatRelativeTime(a.createdAt),
        read: a.read,
      })),
      aiInsights: latestCrop?.[0]
        ? latestCrop[0].tips.slice(0, 3).map((tip, i) => ({
            title: ['Yield Optimization', 'Hydration Logic', 'Pest Management'][i] || 'Farm Tip',
            description: tip,
          }))
        : [
            { title: 'Yield Optimization', description: 'Apply micro-nutrients during flowering.' },
            { title: 'Hydration Logic', description: 'Drip irrigation saves 40% water vs flood.' },
            { title: 'Pest Management', description: 'Maintain bee habitats for 20% better set.' },
          ],
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
