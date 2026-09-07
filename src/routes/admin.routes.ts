import { Router } from 'express';
import { adminController } from '../controllers/admin/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { loginSchema, adminProfileSchema, adminPasswordSchema } from '../utils/validators';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), adminController.login);
router.post('/logout', adminController.logout);
router.post('/refresh', adminController.refresh);
router.post('/forgot-password', authLimiter, adminController.forgotPassword);
router.post('/reset-password', authLimiter, adminController.resetPassword);
router.get('/me', authenticate, adminController.getProfile);
router.put('/profile', authenticate, validate(adminProfileSchema), adminController.updateProfile);
router.put('/password', authenticate, authLimiter, validate(adminPasswordSchema), adminController.updatePassword);
router.put('/change-password', authenticate, authLimiter, validate(adminPasswordSchema), adminController.updatePassword);

export default router;
