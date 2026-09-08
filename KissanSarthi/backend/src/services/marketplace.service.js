import MarketListing from '../models/MarketListing.js';
import MarketPrice from '../models/MarketPrice.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';

class MarketplaceService {
  /**
   * Create a new produce listing
   */
  async createListing(sellerId, data, imageUrls = []) {
    const { cropName, category, quantity, unit, pricePerUnit, location, state, district, harvestDate, description, contactNumber } = data;

    const listing = await MarketListing.create({
      sellerId,
      cropName,
      category: category || 'Cereals & Grains',
      quantity: Number(quantity),
      unit: unit || 'quintal',
      pricePerUnit: Number(pricePerUnit),
      images: imageUrls.length ? imageUrls : ['/uploads/marketplace/default-produce.jpg'],
      location,
      state: state || '',
      district: district || '',
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      description: description || '',
      contactNumber,
      status: 'active',
    });

    return listing.populate('sellerId', 'name location verificationStatus profileImage');
  }

  /**
   * Browse and filter listings with Mandi benchmark comparison
   */
  async getListings(query = {}) {
    const { crop, location, category, minPrice, maxPrice, status = 'active', page = 1, limit = 20 } = query;

    // Auto-expire old listings and boosts
    await Promise.all([
      MarketListing.updateMany(
        { status: 'active', expiresAt: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      ),
      MarketListing.updateMany(
        { isBoosted: true, boostedUntil: { $lt: new Date() } },
        { $set: { isBoosted: false } }
      ),
    ]);

    const filter = {};
    if (status) filter.status = status;
    if (crop) filter.cropName = new RegExp(crop.trim(), 'i');
    if (location) filter.location = new RegExp(location.trim(), 'i');
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.pricePerUnit = {};
      if (minPrice) filter.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerUnit.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      MarketListing.find(filter)
        .populate('sellerId', 'name phone location verificationStatus profileImage')
        .sort({ isBoosted: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MarketListing.countDocuments(filter),
    ]);

    // Fetch latest Mandi benchmark prices for distinct crops in the result
    const cropNames = [...new Set(listings.map((l) => l.cropName))];
    const mandiPrices = await MarketPrice.find({
      commodity: { $in: cropNames.map((c) => new RegExp(`^${c}$`, 'i')) },
    })
      .sort({ date: -1 })
      .lean();

    const mandiMap = new Map();
    mandiPrices.forEach((mp) => {
      const key = mp.commodity.toLowerCase();
      if (!mandiMap.has(key)) {
        mandiMap.set(key, mp);
      }
    });

    // Attach Mandi benchmark comparison and mask contact number by default
    const enrichedListings = listings.map((item) => {
      const cropKey = item.cropName.toLowerCase();
      const mandiBenchmark = mandiMap.get(cropKey);

      let comparison = null;
      if (mandiBenchmark) {
        const modal = mandiBenchmark.modalPrice || mandiBenchmark.modal_price || mandiBenchmark.price || 0;
        const diff = item.pricePerUnit - modal;
        comparison = {
          mandiMarket: mandiBenchmark.market || mandiBenchmark.district || 'Regional Mandi',
          modalPrice: modal,
          minPrice: mandiBenchmark.minPrice || mandiBenchmark.min_price || modal * 0.9,
          maxPrice: mandiBenchmark.maxPrice || mandiBenchmark.max_price || modal * 1.1,
          diffFromMandi: diff,
          diffPercent: modal > 0 ? Math.round((diff / modal) * 100) : 0,
        };
      }

      // Hide contact number in raw feed to prevent automated scraping
      const maskedContact = item.contactNumber
        ? `${item.contactNumber.slice(0, 2)}******${item.contactNumber.slice(-2)}`
        : 'Protected';

      return {
        ...item,
        maskedContact,
        contactNumber: undefined, // Hide until user clicks "Contact Seller"
        mandiComparison: comparison,
      };
    });

    return {
      listings: enrichedListings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  /**
   * Get seller's own listings
   */
  async getMyListings(sellerId) {
    return MarketListing.find({ sellerId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Update listing status or price
   */
  async updateListing(id, sellerId, updateData) {
    const listing = await MarketListing.findOne({ _id: id, sellerId });
    if (!listing) {
      throw new AppError('Listing not found or unauthorized', HTTP_STATUS.NOT_FOUND);
    }

    const allowed = ['pricePerUnit', 'quantity', 'status', 'description', 'contactNumber'];
    allowed.forEach((field) => {
      if (updateData[field] !== undefined) {
        listing[field] = updateData[field];
      }
    });

    await listing.save();
    return listing;
  }

  /**
   * Reveal contact number to authenticated buyer and log view count
   */
  async revealContact(id) {
    const listing = await MarketListing.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('sellerId', 'name location verificationStatus');

    if (!listing) {
      throw new AppError('Listing not found', HTTP_STATUS.NOT_FOUND);
    }

    return {
      contactNumber: listing.contactNumber,
      sellerName: listing.sellerId?.name || 'Farmer',
      views: listing.views,
      isVerifiedSeller: listing.sellerId?.verificationStatus === 'verified',
    };
  }
}

export default new MarketplaceService();
