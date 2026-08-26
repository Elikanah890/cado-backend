import { Router } from 'express';
import { adminBlogController } from '../controllers/blog.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { blogPostSchema, blogCategorySchema, blogTagSchema } from '../validations/blog.validation';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/posts', adminBlogController.getAllPosts);
router.post('/posts', validate(blogPostSchema), activityLogger('Create Post', 'blog'), adminBlogController.createPost);
router.put('/posts/:id', validate(blogPostSchema), activityLogger('Update Post', 'blog'), adminBlogController.updatePost);
router.delete('/posts/:id', activityLogger('Delete Post', 'blog'), adminBlogController.deletePost);

router.get('/categories', adminBlogController.getCategories);
router.post('/categories', validate(blogCategorySchema), activityLogger('Create Category', 'blog'), adminBlogController.createCategory);
router.put('/categories/:id', validate(blogCategorySchema), activityLogger('Update Category', 'blog'), adminBlogController.updateCategory);
router.delete('/categories/:id', activityLogger('Delete Category', 'blog'), adminBlogController.deleteCategory);

router.get('/tags', adminBlogController.getTags);
router.post('/tags', validate(blogTagSchema), activityLogger('Create Tag', 'blog'), adminBlogController.createTag);
router.put('/tags/:id', validate(blogTagSchema), activityLogger('Update Tag', 'blog'), adminBlogController.updateTag);
router.delete('/tags/:id', activityLogger('Delete Tag', 'blog'), adminBlogController.deleteTag);

export default router;
