import SensorData from '../models/SensorData.js';

class SensorRepository {
  create(data) {
    return SensorData.create(data);
  }

  findById(id) {
    return SensorData.findById(id).populate('farmer', 'name location');
  }

  findByFarmer(farmerId, limit = 50) {
    return SensorData.find({ farmer: farmerId }).sort({ timestamp: -1 }).limit(limit);
  }

  findLatestByFarmer(farmerId) {
    return SensorData.findOne({ farmer: farmerId }).sort({ timestamp: -1 });
  }

  updateById(id, data) {
    return SensorData.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return SensorData.findByIdAndDelete(id);
  }

  findAll(filter = {}, limit = 100) {
    return SensorData.find(filter).sort({ timestamp: -1 }).limit(limit).populate('farmer', 'name');
  }
}

export default new SensorRepository();
