import { Router } from 'express';
import { registrationController } from '../controllers/registration.controller';
import { registrationLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { registrationSchema } from '../utils/validators';

const router = Router();

router.post('/', registrationLimiter, validate(registrationSchema), registrationController.create);

export default router;
