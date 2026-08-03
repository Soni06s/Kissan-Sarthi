import Alert from '../models/Alert.js';

class AlertRepository {
  create(data) {
    return Alert.create(data);
  }

  createMany(data) {
    return Alert.insertMany(data);
  }

  findByUser(userId, unreadOnly = false) {
    const filter = { user: userId };
    if (unreadOnly) filter.read = false;
    return Alert.find(filter).sort({ createdAt: -1 });
  }

  findById(id) {
    return Alert.findById(id);
  }

  markAsRead(id, userId) {
    return Alert.findOneAndUpdate({ _id: id, user: userId }, { read: true }, { new: true });
  }

  countUnread(userId) {
    return Alert.countDocuments({ user: userId, read: false });
  }
}

export default new AlertRepository();
