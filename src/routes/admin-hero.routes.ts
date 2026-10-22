import { Router } from 'express';
import { adminHeroController } from '../controllers/hero.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { heroSettingSchema } from '../utils/validators';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

router.get('/', adminHeroController.getHero);
router.put('/', validate(heroSettingSchema), activityLogger('Update Hero Settings', 'homepage'), adminHeroController.updateHero);

export default router;
