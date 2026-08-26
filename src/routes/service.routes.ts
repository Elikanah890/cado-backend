import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, serviceController.getAll);
router.get('/:slug', publicLimiter, serviceController.getBySlug);

export default router;
