import ChatHistory from '../models/ChatHistory.js';

class ChatRepository {
  create(data) {
    return ChatHistory.create(data);
  }

  findByUser(userId, limit = 50) {
    return ChatHistory.find({ user: userId }).sort({ timestamp: -1 }).limit(limit);
  }
}

export default new ChatRepository();
