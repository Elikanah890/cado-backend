import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, settingsController.getPublic);

export default router;
