import marketplaceService from '../services/marketplace.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { getFileUrl } from '../middlewares/upload.middleware.js';

export const createListing = asyncHandler(async (req, res) => {
  const imageUrls = req.files?.map((f) => getFileUrl(f, 'marketplace')) || [];
  const listing = await marketplaceService.createListing(req.user._id, req.body, imageUrls);
  sendSuccess(res, 'Produce listing published successfully', listing, HTTP_STATUS.CREATED);
});

export const getListings = asyncHandler(async (req, res) => {
  const result = await marketplaceService.getListings(req.query);
  sendSuccess(res, 'Marketplace listings retrieved', result);
});

export const getMyListings = asyncHandler(async (req, res) => {
  const listings = await marketplaceService.getMyListings(req.user._id);
  sendSuccess(res, 'My produce listings retrieved', listings);
});

export const updateListing = asyncHandler(async (req, res) => {
  const updated = await marketplaceService.updateListing(req.params.id, req.user._id, req.body);
  sendSuccess(res, 'Listing updated successfully', updated);
});

export const revealContact = asyncHandler(async (req, res) => {
  const contact = await marketplaceService.revealContact(req.params.id);
  sendSuccess(res, 'Seller contact revealed', contact);
});
