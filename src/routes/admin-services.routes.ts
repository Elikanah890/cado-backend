import { Router } from 'express';
import { adminServiceController } from '../controllers/service.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { serviceSchema, servicePackageSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', adminServiceController.getAll);
router.post('/', validate(serviceSchema), activityLogger('Create Service', 'services'), adminServiceController.create);
router.put('/:id', validate(serviceSchema), activityLogger('Update Service', 'services'), adminServiceController.update);
router.delete('/:id', activityLogger('Delete Service', 'services'), adminServiceController.delete);

router.post('/:id/packages', validate(servicePackageSchema), activityLogger('Create Package', 'services'), adminServiceController.createPackage);
router.put('/:id/packages/:packageId', validate(servicePackageSchema), activityLogger('Update Package', 'services'), adminServiceController.updatePackage);
router.delete('/:id/packages/:packageId', activityLogger('Delete Package', 'services'), adminServiceController.deletePackage);

export default router;
