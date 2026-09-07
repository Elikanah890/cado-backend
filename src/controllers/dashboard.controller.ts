import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const dashboardController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [
        totalLeads,
        newLeads,
        servicesCount,
        portfolioCount,
        blogPostsCount,
        coursesCount,
        recentLeads,
      ] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'new' } }),
        prisma.service.count({ where: { isActive: true } }),
        prisma.portfolio.count(),
        prisma.blogPost.count({ where: { status: 'published' } }),
        prisma.course.count({ where: { isPublished: true } }),
        prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          stats: {
            totalLeads,
            newLeads,
            servicesCount,
            portfolioCount,
            blogPostsCount,
            coursesCount,
          },
          recentLeads,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
