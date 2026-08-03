import Weather from '../models/Weather.js';

class WeatherRepository {
  create(data) {
    return Weather.create(data);
  }

  createMany(data) {
    return Weather.insertMany(data);
  }

  findByLocation(location, days = 7) {
    return Weather.find({ location: new RegExp(location, 'i') })
      .sort({ date: 1 })
      .limit(days);
  }

  findLatestByLocation(location) {
    return Weather.findOne({ location: new RegExp(location, 'i') }).sort({ date: -1 });
  }

  deleteByLocation(location) {
    return Weather.deleteMany({ location: new RegExp(location, 'i') });
  }
}

export default new WeatherRepository();
