import { Router } from 'express';
import { storeController } from '../controllers/store.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, storeController.getAll);
router.get('/products', publicLimiter, storeController.getAll);
router.get('/products/:slug', publicLimiter, storeController.getBySlug);
router.get('/:slug', publicLimiter, storeController.getBySlug);

export default router;
