import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.get('/stats', dashboardController.getStats);

export default router;
