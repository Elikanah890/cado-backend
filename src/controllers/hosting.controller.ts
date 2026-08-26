import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const hostingController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.hostingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: plans });
    } catch (error) {
      next(error);
    }
  },
};
