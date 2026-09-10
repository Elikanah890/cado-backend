import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const portfolioController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, featured } = req.query;
      const where: any = {};

      if (category && category !== 'All') where.category = category as string;
      if (featured === 'true') where.isFeatured = true;

      const portfolios = await prisma.portfolio.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { completionDate: 'desc' }, { createdAt: 'desc' }],
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: portfolios });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { slug: req.params.slug },
      });
      if (!portfolio) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Portfolio not found' });
      }
      return res.json({ status: 'success', code: 200, data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.portfolio.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      });
      const list = categories
        .map((c) => c.category)
        .filter((c): c is string => Boolean(c && c.trim() !== ''));
      // Sort alphabetically
      list.sort((a, b) => a.localeCompare(b));
      return res.json({ status: 'success', code: 200, data: list });
    } catch (error) {
      next(error);
    }
  },
};

export const adminPortfolioController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const portfolios = await prisma.portfolio.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: portfolios });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: req.params.id },
      });
      if (!portfolio) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Portfolio not found' });
      }
      return res.json({ status: 'success', code: 200, data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groups = await prisma.portfolio.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: { category: true },
      });
      const result = groups
        .filter((g) => g.category && g.category.trim() !== '')
        .map((g) => ({ name: g.category as string, count: g._count.category }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ status: 'success', code: 200, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categoryName = decodeURIComponent(req.params.categoryName);
      if (!categoryName) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Category name required' });
      }
      const updated = await prisma.portfolio.updateMany({
        where: { category: categoryName },
        data: { category: null },
      });
      return res.json({
        status: 'success',
        code: 200,
        message: `Category '${categoryName}' removed from ${updated.count} projects`,
        data: { count: updated.count },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      // Normalize dates
      if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);
      if (data.publishedAt === '') data.publishedAt = null;
      if (data.completionDate) data.completionDate = new Date(data.completionDate);
      if (data.completionDate === '') data.completionDate = null;
      // Normalize empty strings to null (featuredImage nullable)
      if (data.category === '') data.category = null;
      if (data.projectUrl === '') data.projectUrl = null;
      if (data.videoUrl === '') data.videoUrl = null;
      if (data.featuredImage === '') data.featuredImage = null;
      if (data.pdfUrl === '') data.pdfUrl = null;
      if (data.pdfName === '') data.pdfName = null;
      // Ensure techStack is array
      if (data.techStack && !Array.isArray(data.techStack)) data.techStack = [];
      if (data.galleryImages && !Array.isArray(data.galleryImages)) data.galleryImages = [];
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      // Ensure status defaults
      if (!data.status) data.status = 'COMPLETED';

      const portfolio = await prisma.portfolio.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);
      if (data.publishedAt === '') data.publishedAt = null;
      if (data.completionDate) data.completionDate = new Date(data.completionDate);
      if (data.completionDate === '') data.completionDate = null;
      if (data.category === '') data.category = null;
      if (data.projectUrl === '') data.projectUrl = null;
      if (data.videoUrl === '') data.videoUrl = null;
      if (data.featuredImage === '') data.featuredImage = null;
      if (data.pdfUrl === '') data.pdfUrl = null;
      if (data.pdfName === '') data.pdfName = null;
      if (data.techStack && !Array.isArray(data.techStack)) data.techStack = [];
      if (data.galleryImages && !Array.isArray(data.galleryImages)) data.galleryImages = [];
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;

      const portfolio = await prisma.portfolio.update({
        where: { id: req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.portfolio.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Portfolio deleted' });
    } catch (error) {
      next(error);
    }
  },
};
