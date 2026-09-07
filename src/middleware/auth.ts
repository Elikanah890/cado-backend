import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'access') {
      return res.status(401).json({ status: 'error', code: 401, message: 'Invalid or expired token' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    if (!admin || decoded.tokenVersion !== admin.tokenVersion) {
      return res.status(401).json({ status: 'error', code: 401, message: 'Invalid or expired token' });
    }

    req.admin = { id: admin.id, email: admin.email, role: admin.role };
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', code: 401, message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = verifyToken(token);
      if (decoded.type === 'access') {
        const admin = await prisma.admin.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, role: true, tokenVersion: true },
        });
        if (admin && decoded.tokenVersion === admin.tokenVersion) {
          req.admin = { id: admin.id, email: admin.email, role: admin.role };
        }
      }
    }
  } catch (_) {}
  next();
};
