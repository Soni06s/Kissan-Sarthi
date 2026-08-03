import communityService from '../services/community.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';

export const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, search, state, district, sort = 'recent', tag, author, date, location } = req.query;
  
  const query = {};
  if (category) query.category = category;
  if (tag) query.tags = { $in: [new RegExp(tag, 'i')] };
  if (author) query.author = author;
  if (state) query['location.state'] = state;
  if (district) query['location.district'] = district;
  if (location) {
    query.$or = [
      { 'location.state': { $regex: location, $options: 'i' } },
      { 'location.district': { $regex: location, $options: 'i' } },
      { 'location.village': { $regex: location, $options: 'i' } }
    ];
  }
  if (date) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }
  if (search) {
    const searchOr = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
    query.$and = query.$or ? [{ $or: query.$or }, { $or: searchOr }] : [{ $or: searchOr }];
    delete query.$or;
  }

  if (req.user?.role !== ROLES.ADMIN) {
    const visibilityOr = [{ visibility: { $ne: 'private' } }];
    if (req.user?._id) visibilityOr.push({ author: req.user._id });
    query.$and = [...(query.$and || []), { $or: visibilityOr }];
  }

  const sortOptions = {};
  if (sort === 'popular') sortOptions.likes = -1;
  else if (sort === 'trending') Object.assign(sortOptions, { pinned: -1, featured: -1, shareCount: -1, commentCount: -1, createdAt: -1 });
  else if (sort === 'pinned') Object.assign(query, { pinned: true });
  else if (sort === 'commented') sortOptions.commentCount = -1;
  else sortOptions.createdAt = -1;

  const data = await communityService.getPosts(query, parseInt(page, 10), parseInt(limit, 10), sortOptions);
  sendSuccess(res, 'Posts fetched', data);
});

export const createPost = asyncHandler(async (req, res) => {
  const images = req.files?.images?.map(f => `/uploads/posts/${f.filename}`) || [];
  const videos = [
    ...(req.files?.videos?.map(f => `/uploads/posts/${f.filename}`) || []),
    ...(req.files?.video?.[0] ? [`/uploads/posts/${req.files.video[0].filename}`] : [])
  ];
  const video = videos[0] || null;
  
  const data = await communityService.createPost(req.user._id, { ...req.body, images, videos, video });
  sendSuccess(res, 'Post created', { post: data }, HTTP_STATUS.CREATED);
});

export const getPost = asyncHandler(async (req, res) => {
  const data = await communityService.getPostById(req.params.id, true, req.user);
  sendSuccess(res, 'Post fetched', data);
});

export const updatePost = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const images = req.files?.images?.map(f => `/uploads/posts/${f.filename}`);
  const videos = [
    ...(req.files?.videos?.map(f => `/uploads/posts/${f.filename}`) || []),
    ...(req.files?.video?.[0] ? [`/uploads/posts/${req.files.video[0].filename}`] : [])
  ];
  
  const updateData = { ...req.body };
  if (images && images.length > 0) updateData.images = images;
  if (videos.length > 0) {
    updateData.videos = videos;
    updateData.video = videos[0];
  }

  const data = await communityService.updatePost(req.params.id, req.user._id, updateData, isAdmin);
  sendSuccess(res, 'Post updated', { post: data });
});

export const deletePost = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const result = await communityService.deletePost(req.params.id, req.user._id, isAdmin);
  sendSuccess(res, result.message);
});

export const likePost = asyncHandler(async (req, res) => {
  const data = await communityService.toggleLike(req.params.id, req.user._id);
  sendSuccess(res, 'Post like toggled', { post: data });
});

export const commentPost = asyncHandler(async (req, res) => {
  const data = await communityService.addComment(req.params.id, req.user._id, req.body.text, req.body.parentComment);
  sendSuccess(res, 'Comment added', { comment: data }, HTTP_STATUS.CREATED);
});

export const getComments = asyncHandler(async (req, res) => {
  const data = await communityService.getComments(req.params.id);
  sendSuccess(res, 'Comments fetched', { comments: data });
});

export const updateComment = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const data = await communityService.updateComment(req.params.id, req.user._id, req.body.text, isAdmin);
  sendSuccess(res, 'Comment updated', { comment: data });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const result = await communityService.deleteComment(req.params.postId || null, req.params.commentId || req.params.id, req.user._id, isAdmin);
  sendSuccess(res, result.message);
});

export const likeComment = asyncHandler(async (req, res) => {
  const data = await communityService.toggleCommentLike(req.params.id, req.user._id);
  sendSuccess(res, 'Comment like toggled', { comment: data });
});

export const sharePost = asyncHandler(async (req, res) => {
  const data = await communityService.sharePost(req.params.id);
  sendSuccess(res, 'Post shared', { post: data });
});

export const bookmarkPost = asyncHandler(async (req, res) => {
  const result = await communityService.bookmarkPost(req.params.id, req.user._id);
  sendSuccess(res, result.bookmarked ? 'Post bookmarked' : 'Post removed from bookmarks', result);
});

export const reportPost = asyncHandler(async (req, res) => {
  const data = await communityService.reportPost(req.params.id, req.user._id, req.body.reason, req.body.details);
  sendSuccess(res, 'Post reported', { report: data }, HTTP_STATUS.CREATED);
});

export const getMyPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  const query = {};
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  const data = await communityService.getMyPosts(req.user._id, parseInt(page, 10), parseInt(limit, 10), query);
  sendSuccess(res, 'My posts fetched', data);
});

export const getBookmarks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await communityService.getBookmarks(req.user._id, parseInt(page, 10), parseInt(limit, 10));
  sendSuccess(res, 'Bookmarks fetched', data);
});

export const getTrending = asyncHandler(async (req, res) => {
  const data = await communityService.getTrending(parseInt(req.query.limit || 10, 10));
  sendSuccess(res, 'Trending posts fetched', data);
});

export const getCategories = asyncHandler(async (req, res) => {
  const data = await communityService.getCategories();
  sendSuccess(res, 'Categories fetched', { categories: data });
});

export const searchPosts = asyncHandler(async (req, res) => {
  req.query.search = req.query.q || req.query.search || '';
  return getPosts(req, res);
});

export const moderatePost = asyncHandler(async (req, res) => {
  const data = await communityService.moderatePost(req.params.id, req.body);
  sendSuccess(res, 'Post moderated', { post: data });
});

export const followUser = asyncHandler(async (req, res) => {
  const result = await communityService.followUser(req.user._id, req.params.id);
  sendSuccess(res, result.followed ? 'User followed' : 'User unfollowed', result);
});
