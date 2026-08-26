import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', activityController.getAll);
router.get('/:id', activityController.getOne);
router.delete('/clear-all', activityController.clearAll);
router.delete('/:id', activityController.delete);

export default router;
