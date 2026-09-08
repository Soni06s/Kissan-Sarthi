import schemeService from '../services/scheme.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getSchemes = asyncHandler(async (req, res) => {
  const schemes = await schemeService.getSchemes({
    category: req.query.category,
    user: req.user,
    bookmarkedOnly: req.query.bookmarked === 'true',
    search: req.query.search,
  });
  sendSuccess(res, 'Government schemes fetched successfully', schemes);
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const result = await schemeService.toggleBookmark(req.params.id, req.user._id);
  sendSuccess(res, result.isBookmarked ? 'Scheme bookmarked' : 'Scheme removed from bookmarks', result);
});
