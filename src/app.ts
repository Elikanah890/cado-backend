import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';

import adminRoutes from './routes/admin.routes';
import serviceRoutes from './routes/service.routes';
import adminServiceRoutes from './routes/admin-services.routes';
import portfolioRoutes from './routes/portfolio.routes';
import adminPortfolioRoutes from './routes/admin-portfolio.routes';
import blogRoutes from './routes/blog.routes';
import adminBlogRoutes from './routes/admin-blog.routes';
import storeRoutes from './routes/store.routes';
import adminStoreRoutes from './routes/admin-store.routes';
import courseRoutes from './routes/course.routes';
import adminCourseRoutes from './routes/admin-course.routes';
import contactRoutes from './routes/contact.routes';
import adminLeadRoutes from './routes/admin-leads.routes';
import testimonialRoutes from './routes/testimonial.routes';
import adminTestimonialRoutes from './routes/admin-testimonials.routes';
import adminSettingsRoutes from './routes/admin-settings.routes';
import adminMediaRoutes from './routes/admin-media.routes';
import adminActivityRoutes from './routes/admin-activities.routes';
import adminDashboardRoutes from './routes/admin-dashboard.routes';
import hostingRoutes from './routes/hosting.routes';
import pricingRoutes from './routes/pricing.routes';
import adminPricingRoutes from './routes/admin-pricing.routes';
import publicSettingsRoutes from './routes/settings.routes';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['https://cado-frontend-kappa.vercel.app'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Validate required environment variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Missing ${env} in environment variables`);
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(
  '/uploads',
  cors({ origin: true, credentials: true }),
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'success', code: 200, message: 'CadorDigital API is running', timestamp: new Date().toISOString() });
});

app.use('/api/admin', adminRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/admin/portfolio', adminPortfolioRoutes);
app.use('/api/admin/blog', adminBlogRoutes);
app.use('/api/admin/store', adminStoreRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/academy', adminCourseRoutes);
app.use('/api/admin/leads', adminLeadRoutes);
app.use('/api/admin/testimonials', adminTestimonialRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/media', adminMediaRoutes);
app.use('/api/admin/activities', adminActivityRoutes);
app.use('/api/admin/pricing', adminPricingRoutes);

app.use('/api/services', serviceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/academy', courseRoutes);
app.use('/api', contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/hosting', hostingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/settings', publicSettingsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`CadorDigital API server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Frontend URL: ${config.frontendUrl}`);
});

export default app;
