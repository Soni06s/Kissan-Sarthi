import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { protect, optionalAuth, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadPostMedia } from '../middlewares/upload.middleware.js';
import { postValidator, commentValidator } from '../validators/resource.validator.js';

const router = Router();

// Posts
router.get('/', optionalAuth, communityController.getPosts);
router.get('/myposts', protect, communityController.getMyPosts);
router.get('/bookmarks', protect, communityController.getBookmarks);
router.get('/trending', optionalAuth, communityController.getTrending);
router.get('/categories', optionalAuth, communityController.getCategories);
router.get('/search', optionalAuth, communityController.searchPosts);
router.post('/', protect, uploadPostMedia, postValidator, validate, communityController.createPost);
router.get('/:id', optionalAuth, communityController.getPost);
router.put('/:id', protect, uploadPostMedia, postValidator, validate, communityController.updatePost);
router.patch('/:id', protect, uploadPostMedia, communityController.updatePost);
router.delete('/:id', protect, communityController.deletePost);

// Interactions
router.post('/:id/like', protect, communityController.likePost);
router.post('/:id/share', protect, communityController.sharePost);
router.post('/:id/bookmark', protect, communityController.bookmarkPost);
router.post('/:id/report', protect, communityController.reportPost);

// Comments
router.get('/:id/comments', optionalAuth, communityController.getComments);
router.post('/:id/comment', protect, commentValidator, validate, communityController.commentPost);
router.post('/:id/comments', protect, commentValidator, validate, communityController.commentPost);
router.patch('/comments/:id', protect, commentValidator, validate, communityController.updateComment);
router.delete('/comments/:id', protect, communityController.deleteComment);
router.post('/comments/:id/like', protect, communityController.likeComment);
router.delete('/:postId/comment/:commentId', protect, communityController.deleteComment);

// Admin moderation
router.patch('/admin/:id/moderate', protect, authorizeAdmin, communityController.moderatePost);

// User specific
router.post('/user/:id/follow', protect, communityController.followUser);

export default router;
