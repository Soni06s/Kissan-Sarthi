import MarketPrice from '../models/MarketPrice.js';

class MarketRepository {
  create(data) {
    return MarketPrice.create(data);
  }

  createMany(data) {
    return MarketPrice.insertMany(data);
  }

  findById(id) {
    return MarketPrice.findById(id);
  }

  findAll(filter = {}, limit = 100) {
    return MarketPrice.find(filter).sort({ date: -1 }).limit(limit);
  }

  findByCommodity(commodity, mandi, days = 30) {
    const filter = { commodity: new RegExp(commodity, 'i') };
    if (mandi) filter.mandi = new RegExp(mandi, 'i');
    return MarketPrice.find(filter).sort({ date: 1 }).limit(days);
  }

  findLatestByCommodity(commodity, mandi) {
    const filter = { commodity: new RegExp(commodity, 'i') };
    if (mandi) filter.mandi = new RegExp(mandi, 'i');
    return MarketPrice.findOne(filter).sort({ date: -1 });
  }

  updateById(id, data) {
    return MarketPrice.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return MarketPrice.findByIdAndDelete(id);
  }

  getDistinctCommodities() {
    return MarketPrice.distinct('commodity');
  }
}

export default new MarketRepository();
