import marketRepository from '../repositories/market.repository.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

class MarketService {
  async getPrices({ commodity, mandi }) {
    if (commodity) {
      const history = await marketRepository.findByCommodity(commodity, mandi, 30);
      const latest = history[history.length - 1];
      const prev = history.length > 1 ? history[history.length - 2] : null;

      return {
        commodity,
        mandi: mandi || latest?.mandi,
        current: latest,
        history: history.map((h) => h.price),
        trend: latest?.trend || 'stable',
        change: prev ? latest.price - prev.price : 0,
      };
    }

    const all = await marketRepository.findAll({}, 50);
    const commodities = await marketRepository.getDistinctCommodities();

    const summary = await Promise.all(
      commodities.map(async (c) => {
        const latest = await marketRepository.findLatestByCommodity(c);
        const history = await marketRepository.findByCommodity(c, null, 2);
        const prev = history.length > 1 ? history[0] : null;
        return {
          name: c,
          price: latest?.price ?? 0,
          prev: prev?.price ?? latest?.price ?? 0,
          trend: latest?.trend ?? 'stable',
          mandi: latest?.mandi,
          vol: 'Low',
        };
      })
    );

    return { prices: all, summary };
  }

  async create(data) {
    return marketRepository.create(data);
  }

  async update(id, data) {
    const record = await marketRepository.updateById(id, data);
    if (!record) throw new AppError('Market price not found', HTTP_STATUS.NOT_FOUND);
    return record;
  }

  async delete(id) {
    const record = await marketRepository.deleteById(id);
    if (!record) throw new AppError('Market price not found', HTTP_STATUS.NOT_FOUND);
    return record;
  }

  async fetchFromExternalAPI(commodity, mandi) {
    const apiKey = process.env.MANDI_API_KEY;
    if (!apiKey) {
      logger.warn('MANDI_API_KEY not set. Using MongoDB data only.');
      return this.getPrices({ commodity, mandi });
    }
    return this.getPrices({ commodity, mandi });
  }
}

export default new MarketService();
