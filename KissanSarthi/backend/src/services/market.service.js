import axios from 'axios';
import marketRepository from '../repositories/market.repository.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

class MarketService {
  async getPrices({ commodity, mandi, state, district }) {
    // If external Mandi API key is configured, attempt fetching live data first
    if (process.env.MANDI_API_KEY) {
      try {
        await this.syncFromExternalAPI(commodity, mandi);
      } catch (err) {
        logger.warn(`External Mandi API sync warning: ${err.message}`);
      }
    }

    if (commodity) {
      const history = await marketRepository.findByCommodity(commodity, mandi, 30);

      if (!history || history.length === 0) {
        // Return clear structured result if no historical entries exist
        return {
          commodity,
          mandi: mandi || 'All Mandis',
          current: null,
          history: [],
          trend: 'stable',
          change: 0,
        };
      }

      const latest = history[history.length - 1];
      const prev = history.length > 1 ? history[history.length - 2] : null;
      const change = prev ? latest.price - prev.price : 0;
      const calculatedTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

      return {
        commodity,
        mandi: mandi || latest?.mandi,
        current: latest,
        history: history.map((h) => h.price),
        trend: calculatedTrend,
        change,
      };
    }

    const query = {};
    if (state) query.state = new RegExp(state, 'i');
    if (district) query.district = new RegExp(district, 'i');

    const all = await marketRepository.findAll(query, 50);
    const commodities = await marketRepository.getDistinctCommodities();

    const summary = await Promise.all(
      commodities.map(async (c) => {
        const latest = await marketRepository.findLatestByCommodity(c);
        const history = await marketRepository.findByCommodity(c, null, 7);
        const prev = history.length > 1 ? history[history.length - 2] : null;
        const change = prev && latest ? latest.price - prev.price : 0;
        const pctChange = prev?.price ? Number((((latest.price - prev.price) / prev.price) * 100).toFixed(1)) : 0;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

        return {
          name: c,
          price: latest?.price ?? 0,
          prev: prev?.price ?? latest?.price ?? 0,
          change,
          pctChange,
          trend,
          mandi: latest?.mandi || 'Regional Mandi',
          vol: Math.abs(change) > 50 ? 'High' : 'Moderate',
          history: history.length > 0 ? history.map((h) => h.price) : [latest?.price ?? 2000],
        };
      })
    );

    // Compute dynamic sentiment and top gainer from real DB records
    let totalPct = 0;
    let gainers = 0;
    let losers = 0;
    let topGainer = null;
    let maxGain = -Infinity;

    summary.forEach((item) => {
      totalPct += item.pctChange;
      if (item.pctChange > 0) gainers++;
      if (item.pctChange < 0) losers++;
      if (item.pctChange > maxGain) {
        maxGain = item.pctChange;
        topGainer = item;
      }
    });

    const avgChange = summary.length ? (totalPct / summary.length).toFixed(1) : '0.0';
    const sentiment = gainers >= losers ? (gainers === losers ? 'Neutral' : 'Bullish') : 'Bearish';

    const nowHour = new Date().getHours();
    const mandiStatus = (nowHour >= 6 && nowHour < 18) ? 'Open' : 'Settlement';

    const sentimentStrip = {
      trend: sentiment,
      topGainer: topGainer ? `${topGainer.name} (+${topGainer.pctChange}%)` : 'Stable',
      priceIndex: `${avgChange >= 0 ? '↑' : '↓'} ${Math.abs(avgChange)}%`,
      mandiStatus,
    };

    return { prices: all, summary, sentiment: sentimentStrip, timestamp: new Date() };
  }

  async syncFromExternalAPI(commodity, mandi) {
    const apiKey = process.env.MANDI_API_KEY;
    if (!apiKey) return;

    const url = `https://api.data.gov.in/resource/${apiKey}?api-key=${process.env.DATA_GOV_KEY || apiKey}&format=json&limit=10`;
    const res = await axios.get(url);
    const records = res.data?.records || [];

    for (const r of records) {
      if (r.commodity && r.modal_price) {
        await marketRepository.create({
          commodity: r.commodity,
          mandi: r.market || mandi || 'General Mandi',
          state: r.state || 'Jammu & Kashmir',
          district: r.district || 'Samba',
          price: parseFloat(r.modal_price),
          minPrice: parseFloat(r.min_price || r.modal_price),
          maxPrice: parseFloat(r.max_price || r.modal_price),
          trend: 'stable',
          date: new Date(),
        });
      }
    }
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
}

export default new MarketService();
