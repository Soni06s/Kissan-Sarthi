import CropRecommendation from '../models/CropRecommendation.js';

class CropRepository {
  create(data) {
    return CropRecommendation.create(data);
  }

  findByUser(userId, limit = 20) {
    return CropRecommendation.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
  }
}

export default new CropRepository();
