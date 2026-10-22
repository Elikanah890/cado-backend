import { Router } from 'express';
import { adminProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { productSchema } from '../utils/validators';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

router.get('/', adminProductController.getAll);
router.get('/:id', adminProductController.getById);
router.post('/', validate(productSchema), activityLogger('Create Product', 'shop'), adminProductController.create);
router.put('/:id', validate(productSchema), activityLogger('Update Product', 'shop'), adminProductController.update);
router.delete('/:id', activityLogger('Delete Product', 'shop'), adminProductController.delete);

export default router;
