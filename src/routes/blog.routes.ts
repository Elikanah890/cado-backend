import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { publicLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../validations/blog.validation';

const router = Router();

router.get('/', publicLimiter, blogController.getAllPosts);
router.get('/posts', publicLimiter, blogController.getAllPosts);
router.get('/categories', publicLimiter, blogController.getCategories);
router.get('/tags', publicLimiter, blogController.getTags);
router.get('/posts/:slug', publicLimiter, blogController.getPost);
router.get('/related/:slug', publicLimiter, blogController.getRelatedPosts);
router.get('/:slug/comments', publicLimiter, blogController.getComments);
router.post('/:slug/comments', publicLimiter, validate(createCommentSchema), blogController.createComment);
router.get('/:slug', publicLimiter, blogController.getPost);

export default router;