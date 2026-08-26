import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, blogController.getAllPosts);
router.get('/posts', publicLimiter, blogController.getAllPosts);
router.get('/categories', publicLimiter, blogController.getCategories);
router.get('/tags', publicLimiter, blogController.getTags);
router.get('/posts/:slug', publicLimiter, blogController.getPost);
router.get('/:slug', publicLimiter, blogController.getPost);

export default router;
