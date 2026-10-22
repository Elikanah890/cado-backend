import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, productController.getAll);
router.get('/:slug', publicLimiter, productController.getBySlug);

export default router;
