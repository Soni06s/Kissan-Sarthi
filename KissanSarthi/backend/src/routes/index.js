import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import sensorRoutes from './sensor.routes.js';
import weatherRoutes from './weather.routes.js';
import cropRoutes from './crop.routes.js';
import marketRoutes from './market.routes.js';
import fertilizerRoutes from './fertilizer.routes.js';
import communityRoutes from './community.routes.js';
import alertRoutes from './alert.routes.js';
import chatRoutes from './chat.routes.js';
import adminRoutes from './admin.routes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (req, res) => {
  sendSuccess(res, 'KissanSarthi API is running', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sensors', sensorRoutes);
router.use('/weather', weatherRoutes);
router.use('/crop', cropRoutes);
router.use('/market', marketRoutes);
router.use('/fertilizer', fertilizerRoutes);
router.use('/posts', communityRoutes);
router.use('/community/posts', communityRoutes);
router.use('/community', communityRoutes);
router.use('/alerts', alertRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);

export default router;
