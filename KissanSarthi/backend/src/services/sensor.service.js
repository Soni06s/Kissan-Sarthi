import sensorRepository from '../repositories/sensor.repository.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';

class SensorService {
  async getAll(farmerId) {
    return sensorRepository.findByFarmer(farmerId);
  }

  async create(farmerId, data) {
    return sensorRepository.create({ ...data, farmer: farmerId });
  }

  async update(id, farmerId, data, isAdmin = false) {
    const sensor = await sensorRepository.findById(id);
    if (!sensor) throw new AppError('Sensor record not found', HTTP_STATUS.NOT_FOUND);
    if (!isAdmin && sensor.farmer.toString() !== farmerId.toString()) {
      throw new AppError('Not authorized to update this record', HTTP_STATUS.FORBIDDEN);
    }
    return sensorRepository.updateById(id, data);
  }

  async delete(id, farmerId, isAdmin = false) {
    const sensor = await sensorRepository.findById(id);
    if (!sensor) throw new AppError('Sensor record not found', HTTP_STATUS.NOT_FOUND);
    if (!isAdmin && sensor.farmer.toString() !== farmerId.toString()) {
      throw new AppError('Not authorized to delete this record', HTTP_STATUS.FORBIDDEN);
    }
    return sensorRepository.deleteById(id);
  }
}

export default new SensorService();
