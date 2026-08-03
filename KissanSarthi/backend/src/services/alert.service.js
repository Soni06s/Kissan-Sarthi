import alertRepository from '../repositories/alert.repository.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';
import { formatRelativeTime } from '../utils/helpers.js';

class AlertService {
  async getAlerts(userId) {
    const alerts = await alertRepository.findByUser(userId);
    return alerts.map((a) => ({
      id: a._id,
      type: a.type,
      message: a.message,
      text: a.message,
      read: a.read,
      time: formatRelativeTime(a.createdAt),
      createdAt: a.createdAt,
    }));
  }

  async createAlert(data) {
    return alertRepository.create(data);
  }

  async markAsRead(id, userId) {
    const alert = await alertRepository.markAsRead(id, userId);
    if (!alert) throw new AppError('Alert not found', HTTP_STATUS.NOT_FOUND);
    return alert;
  }
}

export default new AlertService();
