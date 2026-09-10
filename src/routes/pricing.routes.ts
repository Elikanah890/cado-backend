import { Router } from 'express';
import { pricingPublicController } from '../controllers/pricing.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, pricingPublicController.getPricing);
router.get('/plans', publicLimiter, pricingPublicController.getPlans);

export default router;
