import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, courseController.getAll);
router.get('/:slug', publicLimiter, courseController.getBySlug);
router.get('/:slug/learn', publicLimiter, courseController.getLearn);

export default router;
