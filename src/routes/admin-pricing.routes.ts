import { Router } from 'express';
import {
  adminPricingPlanController,
  adminPricingCategoryController,
} from '../controllers/pricing.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import {
  pricingPlanSchema,
  pricingCategorySchema,
} from '../validations/pricing.validation';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

// Pricing Categories
router.get('/categories', adminPricingCategoryController.getAll);
router.post('/categories', validate(pricingCategorySchema), activityLogger('Create Pricing Category', 'pricing'), adminPricingCategoryController.create);
router.put('/categories/:id', validate(pricingCategorySchema), activityLogger('Update Pricing Category', 'pricing'), adminPricingCategoryController.update);
router.delete('/categories/:id', activityLogger('Delete Pricing Category', 'pricing'), adminPricingCategoryController.delete);

// Pricing Plans
router.get('/plans', adminPricingPlanController.getAll);
router.post('/plans', validate(pricingPlanSchema), activityLogger('Create Pricing Plan', 'pricing'), adminPricingPlanController.create);
router.put('/plans/:id', validate(pricingPlanSchema), activityLogger('Update Pricing Plan', 'pricing'), adminPricingPlanController.update);
router.delete('/plans/:id', activityLogger('Delete Pricing Plan', 'pricing'), adminPricingPlanController.delete);

export default router;
