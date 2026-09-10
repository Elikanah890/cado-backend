import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const CACHE_TTL_SECONDS = 60;
const CACHE_KEYS = [
  'bundle:homepage',
  'bundle:services-page',
  'bundle:portfolio-page',
  'bundle:blog-page',
  'bundle:academy-page',
  'bundle:pricing-page',
];

async function getCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (error) {
      console.warn(`Redis read failed for ${key}:`, error);
    }
  }

  const value = await loader();

  if (redis) {
    try {
      await redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(value));
    } catch (error) {
      console.warn(`Redis write failed for ${key}:`, error);
    }
  }

  return value;
}

export async function invalidateHomepageCache() {
  if (!redis) return;

  try {
    await redis.del(...CACHE_KEYS);
  } catch (error) {
    console.warn('Redis cache invalidation failed:', error);
  }
}

function sendBundle(res: Response, data: unknown) {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
  return res.json({ status: 'success', code: 200, data });
}

const serviceQuery = () => prisma.service.findMany({
  where: { isActive: true },
  include: { packages: { orderBy: { sortOrder: 'asc' } } },
  orderBy: { sortOrder: 'asc' },
});

const portfolioQuery = () => prisma.portfolio.findMany({
  orderBy: [{ sortOrder: 'asc' }, { completionDate: 'desc' }, { createdAt: 'desc' }],
});

const blogPostsQuery = () => prisma.blogPost.findMany({
  where: { status: 'published' },
  include: {
    category: true,
    tags: { include: { tag: true } },
    _count: { select: { comments: true } },
  },
  orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
  take: 12,
});

const pricingQuery = () => Promise.all([
  prisma.pricingPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  prisma.hostingPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  prisma.customService.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
]).then(([plans, hosting, custom]) => ({ plans, hosting, custom }));

const academyQuery = () => prisma.course.findMany({
  where: { isActive: true },
  include: { _count: { select: { modules: true } } },
  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
});

const portfolioCategoriesQuery = () => prisma.portfolio.findMany({
  where: { category: { not: null } },
  select: { category: true },
  distinct: ['category'],
}).then((categories) => categories
  .map(({ category }) => category)
  .filter((category): category is string => Boolean(category && category.trim()))
  .sort((a, b) => a.localeCompare(b)));

const blogCategoriesQuery = () => prisma.blogCategory.findMany({
  include: { _count: { select: { posts: true } } },
  orderBy: { name: 'asc' },
});

const blogTagsQuery = () => prisma.blogTag.findMany({
  include: { _count: { select: { posts: true } } as any },
  orderBy: { name: 'asc' },
});

const academyCategoriesQuery = () => prisma.course.findMany({
  where: { isActive: true, category: { not: null } },
  select: { category: true },
  distinct: ['category'],
}).then((categories) => categories
  .map(({ category }) => category)
  .filter((category): category is string => Boolean(category && category.trim()))
  .sort((a, b) => a.localeCompare(b)));

export const homepageController = {
  async getHomepage(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getCached('bundle:homepage', async () => {
        const [services, portfolio, blog, pricing, academy] = await Promise.all([
          serviceQuery(),
          portfolioQuery(),
          blogPostsQuery(),
          pricingQuery(),
          academyQuery(),
        ]);
        const testimonials = await prisma.testimonial.findMany({
          where: { isApproved: true },
          include: { service: { select: { name: true, slug: true, featuredImage: true } } },
          orderBy: { sortOrder: 'asc' },
        });
        return { services, portfolio, blog, pricing, academy, testimonials, testimonialCount: testimonials.length };
      });
      return sendBundle(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getServicesPage(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getCached('bundle:services-page', async () => {
        const [services, testimonials] = await Promise.all([
          serviceQuery(),
          prisma.testimonial.findMany({
            where: { isApproved: true },
            include: { service: { select: { name: true, slug: true } } },
            orderBy: { sortOrder: 'asc' },
          }),
        ]);
        return { services, testimonials };
      });
      return sendBundle(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getPortfolioPage(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getCached('bundle:portfolio-page', async () => {
        const [portfolio, categories] = await Promise.all([portfolioQuery(), portfolioCategoriesQuery()]);
        return { portfolio, categories };
      });
      return sendBundle(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getBlogPage(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search, page = '1', limit = '9' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.max(1, parseInt(limit as string) || 9);
      const cacheKey = `bundle:blog-page:${category || 'all'}:${search || ''}:${pageNum}:${limitNum}`;

      const data = await getCached(cacheKey, async () => {
        const where: any = { status: 'published' };

        if (category) {
          const cat = await prisma.blogCategory.findUnique({ where: { slug: category as string } });
          where.categoryId = cat ? cat.id : 'non-existent';
        }
        if (search) {
          where.OR = [
            { title: { contains: search as string, mode: 'insensitive' } },
            { excerpt: { contains: search as string, mode: 'insensitive' } },
            { content: { contains: search as string, mode: 'insensitive' } },
          ];
        }

        const [posts, total, categories, tags] = await Promise.all([
          prisma.blogPost.findMany({
            where,
            include: {
              category: true,
              tags: { include: { tag: true } },
              _count: { select: { comments: true } },
              comments: {
                where: { isApproved: true },
                orderBy: { createdAt: 'desc' },
                take: 2,
              },
            },
            orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
          }),
          prisma.blogPost.count({ where }),
          blogCategoriesQuery(),
          blogTagsQuery(),
        ]);

        return {
          posts,
          categories,
          tags,
          pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
        };
      });
      return sendBundle(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getAcademyPage(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getCached('bundle:academy-page', async () => {
        const [courses, categories] = await Promise.all([academyQuery(), academyCategoriesQuery()]);
        return { courses, categories };
      });
      return sendBundle(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getPricingPage(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getCached('bundle:pricing-page', pricingQuery);
      return sendBundle(res, data);
    } catch (error) {
      next(error);
    }
  },
};
