import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { chatValidator } from '../validators/resource.validator.js';

const router = Router();

router.use(protect);
router.post('/', chatValidator, validate, chatController.sendMessage);
router.get('/history', chatController.getChatHistory);

export default router;
