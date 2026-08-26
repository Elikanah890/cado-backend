import { Router } from 'express';
import { portfolioController } from '../controllers/portfolio.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/categories', publicLimiter, portfolioController.getCategories);
router.get('/', publicLimiter, portfolioController.getAll);
router.get('/:slug', publicLimiter, portfolioController.getBySlug);

export default router;
