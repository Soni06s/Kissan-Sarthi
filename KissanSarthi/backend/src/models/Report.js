import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    reason: { 
      type: String, 
      enum: ['Spam', 'Fake Information', 'Abuse', 'Violence', 'Other'],
      required: true 
    },
    details: { type: String, trim: true, maxlength: 1000 },
    status: { 
      type: String, 
      enum: ['pending', 'reviewed', 'resolved'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

reportSchema.index({ status: 1 });
reportSchema.index({ post: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
