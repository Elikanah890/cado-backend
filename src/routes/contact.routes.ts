import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { contactLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { contactSchema, newsletterSchema } from '../utils/validators';

const router = Router();

router.post('/contact', contactLimiter, validate(contactSchema), leadController.create);
router.post('/newsletter', validate(newsletterSchema), leadController.newsletter);

export default router;
