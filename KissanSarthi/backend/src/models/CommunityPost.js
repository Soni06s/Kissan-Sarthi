import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { 
      type: String, 
      enum: ['Crop Advice', 'Question', 'Disease Alert', 'Market Information', 'Success Story', 'Government Scheme', 'Weather Alert', 'Equipment', 'Organic Farming', 'General Discussion'],
      default: 'General Discussion'
    },
    images: [{ type: String }],
    videos: [{ type: String }],
    video: { type: String, default: null },
    tags: [{ type: String, trim: true, lowercase: true }],
    location: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      village: { type: String, trim: true }
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    status: { type: String, enum: ['draft', 'active', 'hidden', 'rejected', 'deleted'], default: 'active' },
    pinned: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    editHistory: [
      {
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date, default: Date.now },
        changes: [{ type: String }],
      }
    ],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ author: 1 });
communityPostSchema.index({ category: 1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ status: 1 });
communityPostSchema.index({ 'location.state': 1, 'location.district': 1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
