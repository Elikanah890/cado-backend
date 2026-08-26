import { Router } from 'express';
import { pricingPublicController } from '../controllers/pricing.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/plans', publicLimiter, pricingPublicController.getPlans);
router.get('/hosting', publicLimiter, pricingPublicController.getHosting);
router.get('/custom', publicLimiter, pricingPublicController.getCustom);

export default router;
