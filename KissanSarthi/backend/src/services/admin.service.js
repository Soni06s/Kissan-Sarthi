import userRepository from '../repositories/user.repository.js';
import communityRepository from '../repositories/community.repository.js';
import alertRepository from '../repositories/alert.repository.js';
import sensorRepository from '../repositories/sensor.repository.js';
import chatRepository from '../repositories/chat.repository.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';
import { sanitizeUser } from '../utils/helpers.js';

class AdminService {
  async getUsers(page = 1, limit = 20) {
    const users = await userRepository.findAll({}, { page, limit });
    const total = await userRepository.count();
    return {
      users: users.map(sanitizeUser),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    if (user.role === ROLES.ADMIN) {
      throw new AppError('Cannot delete admin user', HTTP_STATUS.FORBIDDEN);
    }
    await userRepository.deleteById(id);
    return { deleted: true };
  }

  async getDashboard() {
    const [totalFarmers, totalPosts, totalSensors] = await Promise.all([
      userRepository.count({ role: ROLES.FARMER }),
      communityRepository.count(),
      sensorRepository.findAll({}, 1),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      stats: [
        {
          label: 'Total Farmers',
          value: totalFarmers.toLocaleString('en-IN'),
          trend: '↑ 4.2%',
          trendUp: true,
          sub: 'Registered users',
        },
        {
          label: 'Community Posts',
          value: String(totalPosts),
          trend: '↑ 12%',
          trendUp: true,
          sub: 'Total posts',
        },
        {
          label: 'Sensor Nodes',
          value: String(totalSensors.length > 0 ? 'Active' : '0'),
          trend: 'Live',
          trendUp: true,
          sub: 'Telemetry online',
        },
      ],
      systemItems: [
        { name: 'AI Crop Advisor', sub: '99.9% uptime', status: 'on', cpu: 38 },
        { name: 'Market price feed', sub: 'Live · MongoDB', status: 'on', cpu: 55 },
        { name: 'Weather API', sub: 'MongoDB storage', status: 'on', cpu: 45 },
        { name: 'Push notifications', sub: 'Operational', status: 'on', cpu: 22 },
      ],
    };
  }
}

export default new AdminService();
