import { Router } from 'express';
import { heroController } from '../controllers/hero.controller';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', publicLimiter, heroController.getHero);

export default router;
