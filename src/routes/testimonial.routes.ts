import { Router } from 'express';
import { testimonialController } from '../controllers/testimonial.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, testimonialController.getAll);

export default router;
