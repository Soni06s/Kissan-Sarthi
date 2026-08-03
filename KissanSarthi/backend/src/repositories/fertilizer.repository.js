import FertilizerHistory from '../models/FertilizerHistory.js';

class FertilizerRepository {
  create(data) {
    return FertilizerHistory.create(data);
  }

  findByUser(userId, limit = 20) {
    return FertilizerHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
  }
}

export default new FertilizerRepository();
