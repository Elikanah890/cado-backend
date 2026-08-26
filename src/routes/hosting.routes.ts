import { Router } from 'express';
import { hostingController } from '../controllers/hosting.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/plans', publicLimiter, hostingController.getAll);

export default router;
