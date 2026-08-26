import { Router } from 'express';
import { adminStoreController } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { storeProductSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', adminStoreController.getAll);
router.post('/', validate(storeProductSchema), activityLogger('Create Product', 'store'), adminStoreController.create);
router.put('/:id', validate(storeProductSchema), activityLogger('Update Product', 'store'), adminStoreController.update);
router.delete('/:id', activityLogger('Delete Product', 'store'), adminStoreController.delete);
router.get('/products', adminStoreController.getAll);
router.post('/products', validate(storeProductSchema), activityLogger('Create Product', 'store'), adminStoreController.create);
router.put('/products/:id', validate(storeProductSchema), activityLogger('Update Product', 'store'), adminStoreController.update);
router.delete('/products/:id', activityLogger('Delete Product', 'store'), adminStoreController.delete);

export default router;
