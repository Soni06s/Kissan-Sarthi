import CommunityPost from '../models/CommunityPost.js';
import Comment from '../models/Comment.js';

class CommunityRepository {
  create(data) {
    return CommunityPost.create(data);
  }

  findById(id) {
    return CommunityPost.findOne({ _id: id, status: { $ne: 'deleted' } })
      .populate('author', 'name location profileImage role badges');
  }

  findAdminById(id) {
    return CommunityPost.findById(id).populate('author', 'name location profileImage role badges');
  }

  async findAll(query = {}, page = 1, limit = 20, sort = { createdAt: -1 }) {
    const skip = (page - 1) * limit;
    
    const filter = { status: 'active', ...query };

    const posts = await CommunityPost.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name location profileImage role badges');
    
    const total = await CommunityPost.countDocuments(filter);
    
    return {
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPosts: total
    };
  }

  updateById(id, data) {
    return CommunityPost.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('author', 'name location profileImage role badges');
  }

  softDeleteById(id) {
    return CommunityPost.findByIdAndUpdate(id, { status: 'deleted', deletedAt: new Date() }, { new: true });
  }

  addLike(postId, userId) {
    return CommunityPost.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true }
    ).populate('author', 'name location profileImage role badges');
  }

  removeLike(postId, userId) {
    return CommunityPost.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    ).populate('author', 'name location profileImage role badges');
  }

  async incrementCommentCount(postId) {
    return CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
  }

  async decrementCommentCount(postId) {
    return CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
  }
  
  async incrementShareCount(postId) {
    return CommunityPost.findByIdAndUpdate(postId, { $inc: { shareCount: 1 } }, { new: true });
  }

  async incrementBookmarkCount(postId, amount) {
    return CommunityPost.findByIdAndUpdate(postId, { $inc: { bookmarkCount: amount } }, { new: true });
  }

  async incrementViewCount(postId) {
    return CommunityPost.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } }, { new: true })
      .populate('author', 'name location profileImage role badges');
  }

  async incrementReportCount(postId) {
    return CommunityPost.findByIdAndUpdate(postId, { $inc: { reportCount: 1 } }, { new: true });
  }

  count() {
    return CommunityPost.countDocuments({ status: { $ne: 'deleted' } });
  }
}

export default new CommunityRepository();
