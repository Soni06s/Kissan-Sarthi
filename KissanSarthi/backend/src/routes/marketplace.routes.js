import { Router } from 'express';
import * as marketplaceController from '../controllers/marketplace.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { uploadMarketplaceMedia } from '../middlewares/upload.middleware.js';

const router = Router();

// Public / optional auth for browsing
router.get('/', optionalAuth, marketplaceController.getListings);

// Protected routes
router.use(protect);
router.post('/', uploadMarketplaceMedia, marketplaceController.createListing);
router.get('/my-listings', marketplaceController.getMyListings);
router.patch('/:id', marketplaceController.updateListing);
router.post('/:id/contact', marketplaceController.revealContact);

export default router;
