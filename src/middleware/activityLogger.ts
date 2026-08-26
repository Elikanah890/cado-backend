import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth';
import logger from '../utils/logger';

export const logActivity = async (
  adminId: string,
  action: string,
  module: string,
  details?: any,
  req?: Request
) => {
  try {
    await prisma.activityLog.create({
      data: {
        adminId,
        action,
        module,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.headers?.['user-agent'],
      },
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};

export const activityLogger = (action: string, module: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode < 400 && req.admin) {
        logActivity(req.admin.id, action, module, { body: req.body, result: body }, req).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
};
