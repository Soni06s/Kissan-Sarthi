import weatherRepository from '../repositories/weather.repository.js';
import logger from '../config/logger.js';

const CONDITION_ICONS = {
  Sunny: 'sunny',
  'Partly Cloudy': 'pCloudy',
  'Heavy Rain': 'hRain',
  Thunderstorm: 'thunder',
  Showers: 'showers',
  'Mostly Sunny': 'mostlySunny',
};

class WeatherService {
  async getForecast(location) {
    const records = await weatherRepository.findByLocation(location, 7);

    if (records.length === 0) {
      return { location, forecast: [], current: null };
    }

    const current = records[0];
    const forecast = records.map((w, i) => ({
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' }),
      icon: CONDITION_ICONS[w.condition] || 'sunny',
      high: Math.round(w.temperature + 3),
      low: Math.round(w.temperature - 5),
      rain: Math.round(w.rainfall),
      desc: w.condition,
      sprayWindow: w.sprayWindow,
      irrigationAdvice: w.irrigationAdvice,
      humidity: w.humidity,
      windSpeed: w.windSpeed,
    }));

    return {
      location,
      current: {
        temperature: current.temperature,
        condition: current.condition,
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        sprayWindow: current.sprayWindow,
        irrigationAdvice: current.irrigationAdvice,
      },
      forecast,
    };
  }

  async create(data) {
    return weatherRepository.create(data);
  }

  async createMany(data) {
    return weatherRepository.createMany(data);
  }

  // Future: plug OpenWeatherMap here without changing controllers
  async fetchFromExternalAPI(location) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      logger.warn('OPENWEATHER_API_KEY not set. Using MongoDB data only.');
      return this.getForecast(location);
    }
    // Placeholder for external API integration
    return this.getForecast(location);
  }
}

export default new WeatherService();
