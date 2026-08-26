import { Router } from 'express';
import { adminLeadController } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', adminLeadController.getAll);
router.get('/stats', adminLeadController.getStats);
router.get('/:id', adminLeadController.getOne);
router.put('/:id', adminLeadController.update);
router.delete('/:id', adminLeadController.delete);

export default router;
