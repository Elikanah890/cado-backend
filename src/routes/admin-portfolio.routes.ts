import { Router } from 'express';
import { adminPortfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { portfolioSchema } from '../utils/validators';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

// Category management
router.get('/categories', adminPortfolioController.getCategories);
router.delete('/categories/:categoryName', activityLogger('Delete Category', 'portfolio'), adminPortfolioController.deleteCategory);

router.get('/', adminPortfolioController.getAll);
router.get('/:id', adminPortfolioController.getById);
router.post('/', validate(portfolioSchema), activityLogger('Create Portfolio', 'portfolio'), adminPortfolioController.create);
router.put('/:id', validate(portfolioSchema), activityLogger('Update Portfolio', 'portfolio'), adminPortfolioController.update);
router.delete('/:id', activityLogger('Delete Portfolio', 'portfolio'), adminPortfolioController.delete);

export default router;
