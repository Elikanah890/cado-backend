import { Router } from 'express';
import { adminSettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', adminSettingsController.getAll);
router.put('/', activityLogger('Update Settings', 'settings'), adminSettingsController.update);
router.get('/:group', adminSettingsController.getByGroup);

export default router;
