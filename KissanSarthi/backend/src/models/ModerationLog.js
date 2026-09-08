import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['delete_post', 'dismiss_report', 'warn_user', 'ban_user', 'hide_post'],
      default: 'delete_post',
    },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' },
    postAuthorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postTitle: { type: String, trim: true },
    reason: { type: String, trim: true, default: 'Content violated community guidelines' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

moderationLogSchema.index({ adminId: 1, createdAt: -1 });
moderationLogSchema.index({ postId: 1 });
moderationLogSchema.index({ action: 1 });

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);
export default ModerationLog;
