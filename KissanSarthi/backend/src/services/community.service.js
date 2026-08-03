import communityRepository from '../repositories/community.repository.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import Report from '../models/Report.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import { formatRelativeTime } from '../utils/helpers.js';

const normalizeTags = (tags) => {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(',');
  return [...new Set(list.map((tag) => String(tag).replace(/^#/, '').trim().toLowerCase()).filter(Boolean))];
};

const normalizeLocation = (data = {}) => {
  if (typeof data.location === 'object' && data.location !== null) return data.location;
  return {
    state: data.state || data['location[state]'] || '',
    district: data.district || data['location[district]'] || '',
    village: data.village || data['location[village]'] || '',
  };
};

const formatPost = (post) => ({
  id: post._id,
  user: post.author?.name || 'Unknown',
  author: post.author,
  avatar: 'user',
  location: post.location || {},
  district: post.location?.district || post.author?.location || '',
  time: formatRelativeTime(post.createdAt),
  title: post.title,
  content: post.content,
  category: post.category,
  images: post.images || [],
  videos: post.videos?.length ? post.videos : (post.video ? [post.video] : []),
  video: post.video,
  tags: post.tags || [],
  likes: post.likes?.length || 0,
  likedBy: post.likes,
  comments: post.commentCount || 0,
  shares: post.shareCount || 0,
  bookmarks: post.bookmarkCount || 0,
  views: post.viewCount || 0,
  reports: post.reportCount || 0,
  visibility: post.visibility,
  status: post.status,
  pinned: post.pinned,
  featured: post.featured,
  edited: post.edited,
  editHistory: post.editHistory || [],
  verified: post.author?.role === 'admin' || post.author?.badges?.includes('expert'),
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const formatComment = (comment) => ({
  id: comment._id,
  post: comment.post,
  author: comment.author?.name || 'Farmer',
  authorId: comment.author?._id || comment.author,
  avatar: comment.author?.profileImage || null,
  text: comment.text,
  parentComment: comment.parentComment,
  likes: comment.likes?.length || 0,
  likedBy: comment.likes || [],
  edited: comment.edited,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  time: formatRelativeTime(comment.createdAt),
});

class CommunityService {
  async getPosts(query = {}, page = 1, limit = 20, sort = { createdAt: -1 }) {
    const data = await communityRepository.findAll(query, page, limit, sort);
    return {
      ...data,
      posts: data.posts.map(formatPost)
    };
  }

  async createPost(authorId, data) {
    const payload = {
      author: authorId,
      ...data,
      tags: normalizeTags(data.tags ?? data['tags[]']),
      location: normalizeLocation(data),
      status: data.status === 'draft' || data.isDraft === 'true' ? 'draft' : 'active',
    };
    const post = await communityRepository.create(payload);
    const populated = await communityRepository.findById(post._id);
    await User.findByIdAndUpdate(authorId, { $inc: { totalPosts: 1 } });
    return formatPost(populated);
  }

  async getPostById(id, incrementView = true, viewer = null) {
    const post = incrementView ? await communityRepository.incrementViewCount(id) : await communityRepository.findById(id);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);
    const viewerId = viewer?._id?.toString();
    const isOwner = viewerId && post.author?._id?.toString() === viewerId;
    const isAdmin = viewer?.role === 'admin';
    if (post.visibility === 'private' && !isOwner && !isAdmin) {
      throw new AppError('Not authorized to view this post', HTTP_STATUS.FORBIDDEN);
    }
    const comments = await this.getComments(id);
    return { post: formatPost(post), comments };
  }

  async updatePost(id, userId, data, isAdmin = false) {
    const post = await communityRepository.findById(id);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);
    if (!isAdmin && post.author._id.toString() !== userId.toString()) {
      throw new AppError('Not authorized to update this post', HTTP_STATUS.FORBIDDEN);
    }
    const changes = Object.keys(data).filter((key) => !['images', 'videos', 'video'].includes(key));
    const mediaTouched = data.mediaTouched === 'true';
    const nextImages = [
      ...(data.existingImages ? (Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages]) : (mediaTouched ? [] : post.images || [])),
      ...(data.images || []),
    ].filter(Boolean);
    const nextVideos = [
      ...(data.existingVideos ? (Array.isArray(data.existingVideos) ? data.existingVideos : [data.existingVideos]) : (mediaTouched ? [] : post.videos || (post.video ? [post.video] : []))),
      ...(data.videos || []),
      ...(!data.videos && data.video ? [data.video] : []),
    ].filter(Boolean);

    const updateData = {
      ...data,
      tags: normalizeTags(data.tags ?? data['tags[]'] ?? post.tags),
      location: normalizeLocation({ ...post.location?.toObject?.(), ...data }),
      images: nextImages,
      videos: nextVideos,
      video: nextVideos[0] || null,
      edited: true,
      $push: { editHistory: { editedBy: userId, changes } },
    };
    delete updateData['tags[]'];
    delete updateData.existingImages;
    delete updateData.existingVideos;
    delete updateData.mediaTouched;

    const updated = await communityRepository.updateById(id, updateData);
    return formatPost(updated);
  }

  async deletePost(id, userId, isAdmin = false) {
    const post = await communityRepository.findById(id);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);
    if (!isAdmin && post.author._id.toString() !== userId.toString()) {
      throw new AppError('Not authorized to delete this post', HTTP_STATUS.FORBIDDEN);
    }
    await communityRepository.softDeleteById(id);
    await User.findByIdAndUpdate(post.author._id, { $inc: { totalPosts: -1 } });
    return { message: 'Post deleted successfully' };
  }

  async toggleLike(postId, userId) {
    const post = await communityRepository.findById(postId);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);

    const hasLiked = post.likes.some((id) => id.toString() === userId.toString());
    const updated = hasLiked
      ? await communityRepository.removeLike(postId, userId)
      : await communityRepository.addLike(postId, userId);

    return formatPost(updated);
  }

  async addComment(postId, userId, text, parentComment = null) {
    const post = await communityRepository.findById(postId);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);

    const comment = await Comment.create({ post: postId, author: userId, text, parentComment });
    await communityRepository.incrementCommentCount(postId);
    
    const populated = await Comment.findById(comment._id).populate('author', 'name profileImage');
    return formatComment(populated);
  }

  async getComments(postId) {
    const comments = await Comment.find({ post: postId, status: 'active' })
      .sort({ createdAt: 1 })
      .populate('author', 'name profileImage');
    return comments.map(formatComment);
  }

  async updateComment(commentId, userId, text, isAdmin = false) {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.status === 'deleted') throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    if (!isAdmin && comment.author.toString() !== userId.toString()) {
      throw new AppError('Not authorized to update this comment', HTTP_STATUS.FORBIDDEN);
    }
    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { text, edited: true },
      { new: true, runValidators: true }
    ).populate('author', 'name profileImage');
    return formatComment(updated);
  }

  async deleteComment(postId, commentId, userId, isAdmin = false) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    
    if (!isAdmin && comment.author.toString() !== userId.toString()) {
      throw new AppError('Not authorized to delete this comment', HTTP_STATUS.FORBIDDEN);
    }

    await Comment.findByIdAndUpdate(commentId, { status: 'deleted', deletedAt: new Date() });
    await communityRepository.decrementCommentCount(postId || comment.post);
    return { message: 'Comment deleted successfully' };
  }

  async toggleCommentLike(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.status === 'deleted') throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    const hasLiked = comment.likes.some((id) => id.toString() === userId.toString());
    const updated = await Comment.findByIdAndUpdate(
      commentId,
      hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { new: true }
    ).populate('author', 'name profileImage');
    return formatComment(updated);
  }

  async sharePost(postId) {
    const post = await communityRepository.incrementShareCount(postId);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);
    return formatPost(post);
  }

  async bookmarkPost(postId, userId) {
    const post = await communityRepository.findById(postId);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);

    const existing = await Bookmark.findOne({ user: userId, post: postId });
    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      await communityRepository.incrementBookmarkCount(postId, -1);
      return { bookmarked: false };
    } else {
      await Bookmark.create({ user: userId, post: postId });
      await communityRepository.incrementBookmarkCount(postId, 1);
      return { bookmarked: true };
    }
  }

  async getBookmarks(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const bookmarks = await Bookmark.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'post',
        match: { status: 'active' },
        populate: { path: 'author', select: 'name location profileImage role badges' },
      });
    const posts = bookmarks.map((item) => item.post).filter(Boolean).map(formatPost);
    const total = await Bookmark.countDocuments({ user: userId });
    return { posts, currentPage: page, totalPages: Math.ceil(total / limit), totalPosts: total };
  }

  async reportPost(postId, userId, reason, details) {
    const post = await communityRepository.findById(postId);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);

    const report = await Report.create({ reportedBy: userId, post: postId, reason, details });
    await communityRepository.incrementReportCount(postId);
    return report;
  }

  async getMyPosts(userId, page = 1, limit = 20, query = {}) {
    return this.getPosts({ ...query, author: userId, status: { $ne: 'deleted' } }, page, limit, { createdAt: -1 });
  }

  async getTrending(limit = 10) {
    const posts = await communityRepository.findAll({}, 1, limit, { pinned: -1, featured: -1, shareCount: -1, commentCount: -1, createdAt: -1 });
    const tags = {};
    posts.posts.forEach((post) => post.tags?.forEach((tag) => { tags[tag] = (tags[tag] || 0) + 1; }));
    return { ...posts, tags: Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([tag]) => tag) };
  }

  async getCategories() {
    return [
      'Crop Advice', 'Question', 'Disease Alert', 'Market Information', 'Success Story',
      'Government Scheme', 'Weather Alert', 'Equipment', 'Organic Farming', 'General Discussion'
    ];
  }

  async moderatePost(id, data) {
    const post = await communityRepository.findAdminById(id);
    if (!post) throw new AppError('Post not found', HTTP_STATUS.NOT_FOUND);
    const allowed = ['status', 'pinned', 'featured', 'visibility'];
    const update = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
    const updated = await communityRepository.updateById(id, update);
    return formatPost(updated);
  }

  async followUser(followerId, followingId) {
    if (followerId.toString() === followingId.toString()) {
      throw new AppError('Cannot follow yourself', HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await Follow.findOne({ follower: followerId, following: followingId });
    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
      return { followed: false };
    } else {
      await Follow.create({ follower: followerId, following: followingId });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
      return { followed: true };
    }
  }
}

export default new CommunityService();
