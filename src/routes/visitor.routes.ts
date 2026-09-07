import { Router } from 'express';
import { visitorController } from '../controllers/visitor.controller';
import { authenticate } from '../middleware/auth';
import { publicLimiter, adminLimiter } from '../middleware/rateLimiter';

export const adminVisitorRoutes = Router();

adminVisitorRoutes.use(authenticate);
adminVisitorRoutes.use(adminLimiter);

adminVisitorRoutes.get('/stats', visitorController.getStats);
adminVisitorRoutes.get('/chart', visitorController.getChart);
adminVisitorRoutes.delete('/clear-all', visitorController.clearAll);

const visitorRoutes = Router();

visitorRoutes.post('/track', publicLimiter, visitorController.track);

export default visitorRoutes;
