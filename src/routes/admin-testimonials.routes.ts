import { Router } from 'express';
import { adminTestimonialController } from '../controllers/testimonial.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { testimonialSchema } from '../utils/validators';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

router.get('/', adminTestimonialController.getAll);
router.post('/', validate(testimonialSchema), activityLogger('Create Testimonial', 'testimonials'), adminTestimonialController.create);
router.put('/:id', validate(testimonialSchema), activityLogger('Update Testimonial', 'testimonials'), adminTestimonialController.update);
router.delete('/:id', activityLogger('Delete Testimonial', 'testimonials'), adminTestimonialController.delete);

export default router;
