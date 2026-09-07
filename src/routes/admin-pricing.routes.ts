import { Router } from 'express';
import {
  adminPricingPlanController,
  adminHostingPlanController,
  adminCustomServiceController,
} from '../controllers/pricing.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import {
  pricingPlanSchema,
  hostingPlanSchema,
  customServiceSchema,
} from '../validations/pricing.validation';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

// Pricing Plans (Startup Bundles)
router.get('/plans', adminPricingPlanController.getAll);
router.post('/plans', validate(pricingPlanSchema), activityLogger('Create Pricing Plan', 'pricing'), adminPricingPlanController.create);
router.put('/plans/:id', validate(pricingPlanSchema), activityLogger('Update Pricing Plan', 'pricing'), adminPricingPlanController.update);
router.delete('/plans/:id', activityLogger('Delete Pricing Plan', 'pricing'), adminPricingPlanController.delete);

// Hosting Plans
router.get('/hosting', adminHostingPlanController.getAll);
router.post('/hosting', validate(hostingPlanSchema), activityLogger('Create Hosting Plan', 'pricing'), adminHostingPlanController.create);
router.put('/hosting/:id', validate(hostingPlanSchema), activityLogger('Update Hosting Plan', 'pricing'), adminHostingPlanController.update);
router.delete('/hosting/:id', activityLogger('Delete Hosting Plan', 'pricing'), adminHostingPlanController.delete);

// Custom Services
router.get('/custom', adminCustomServiceController.getAll);
router.post('/custom', validate(customServiceSchema), activityLogger('Create Custom Service', 'pricing'), adminCustomServiceController.create);
router.put('/custom/:id', validate(customServiceSchema), activityLogger('Update Custom Service', 'pricing'), adminCustomServiceController.update);
router.delete('/custom/:id', activityLogger('Delete Custom Service', 'pricing'), adminCustomServiceController.delete);

export default router;
