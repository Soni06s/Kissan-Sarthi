import { Router } from 'express';
import * as weatherController from '../controllers/weather.controller.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { weatherValidator } from '../validators/resource.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', optionalAuth, weatherController.getWeather);
router.get('/forecast', optionalAuth, weatherController.getWeather);
router.get('/alerts', optionalAuth, weatherController.getWeather);
router.post('/', protect, authorize(ROLES.ADMIN), weatherValidator, validate, weatherController.createWeather);

export default router;
