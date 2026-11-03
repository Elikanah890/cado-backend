import { Router } from 'express';
import { adminRegistrationController } from '../controllers/registration.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import {
  adminManualRegistrationSchema,
  adminRegistrationUpdateSchema,
} from '../utils/validators';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', adminRegistrationController.getAll);
router.get('/stats', adminRegistrationController.stats);
router.post(
  '/',
  validate(adminManualRegistrationSchema),
  activityLogger('Create Registration', 'registrations'),
  adminRegistrationController.createManual
);
router.get('/:id', adminRegistrationController.getOne);
router.put(
  '/:id',
  validate(adminRegistrationUpdateSchema),
  activityLogger('Update Registration', 'registrations'),
  adminRegistrationController.update
);
router.delete(
  '/:id',
  activityLogger('Delete Registration', 'registrations'),
  adminRegistrationController.remove
);

export default router;
