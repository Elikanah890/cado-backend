import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const activityController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { module, adminId, page = '1', limit = '50' } = req.query;
      const where: any = {};
      if (module) where.module = module as string;
      if (adminId) where.adminId = adminId as string;

      const [activities, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: { admin: { select: { email: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.activityLog.count({ where }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          activities,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activity = await prisma.activityLog.findUnique({
        where: { id: req.params.id },
        include: { admin: { select: { email: true } } },
      });
      if (!activity) return res.status(404).json({ status: 'error', code: 404, message: 'Activity not found' });
      return res.json({ status: 'success', code: 200, data: activity });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.activityLog.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Activity deleted' });
    } catch (error) {
      next(error);
    }
  },

  async clearAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { count } = await prisma.activityLog.deleteMany({});
      return res.json({ status: 'success', code: 200, message: `Cleared ${count} activities`, data: { count } });
    } catch (error) {
      next(error);
    }
  },
};
