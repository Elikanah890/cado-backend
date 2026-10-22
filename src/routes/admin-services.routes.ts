import { Router } from 'express';
import { adminServiceController } from '../controllers/service.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { serviceSchema } from '../utils/validators';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

router.get('/', adminServiceController.getAll);
router.post('/', validate(serviceSchema), activityLogger('Create Service', 'services'), adminServiceController.create);
router.put('/:id', validate(serviceSchema), activityLogger('Update Service', 'services'), adminServiceController.update);
router.delete('/:id', activityLogger('Delete Service', 'services'), adminServiceController.delete);


export default router;
