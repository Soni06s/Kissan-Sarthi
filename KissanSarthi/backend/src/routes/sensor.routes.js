import { Router } from 'express';
import * as sensorController from '../controllers/sensor.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sensorValidator } from '../validators/resource.validator.js';

const router = Router();

router.use(protect);
router.get('/', sensorController.getSensors);
router.post('/', sensorValidator, validate, sensorController.createSensor);
router.put('/:id', sensorValidator, validate, sensorController.updateSensor);
router.delete('/:id', sensorController.deleteSensor);

export default router;
