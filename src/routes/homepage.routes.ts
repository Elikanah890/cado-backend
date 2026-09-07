import { Router } from 'express';
import { homepageController } from '../controllers/homepage.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/homepage', publicLimiter, homepageController.getHomepage);
router.get('/services-page', publicLimiter, homepageController.getServicesPage);
router.get('/portfolio-page', publicLimiter, homepageController.getPortfolioPage);
router.get('/blog-page', publicLimiter, homepageController.getBlogPage);
router.get('/academy-page', publicLimiter, homepageController.getAcademyPage);
router.get('/pricing-page', publicLimiter, homepageController.getPricingPage);

export default router;
