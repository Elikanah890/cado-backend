import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import { hashPassword, generateToken, generateRefreshToken, verifyRefreshToken } from '../../utils/auth';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config';
import { logActivity } from '../../middleware/activityLogger';

export const adminController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Email and password are required',
        });
      }

      const admin = await prisma.admin.findUnique({
        where: { email },
        select: { id: true, email: true, password: true, role: true },
      });
      if (!admin) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid credentials' });
      }

      const token = generateToken({ id: admin.id, email: admin.email, role: admin.role });
      const refreshToken = generateRefreshToken({ id: admin.id, email: admin.email, role: admin.role });

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production' && config.frontendUrl.startsWith('https://'),
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production' && config.frontendUrl.startsWith('https://'),
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/admin/refresh',
      });

      await logActivity(admin.id, 'Login', 'auth', { email: admin.email }, req);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('auth_token');
      res.clearCookie('refresh_token', { path: '/api/admin/refresh' });
      return res.json({ status: 'success', code: 200, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ status: 'error', code: 401, message: 'No refresh token' });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true },
      });
      if (!admin) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid token' });
      }

      const newToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
      const newRefreshToken = generateRefreshToken({ id: admin.id, email: admin.email, role: admin.role });

      res.cookie('auth_token', newToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production' && config.frontendUrl.startsWith('https://'),
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production' && config.frontendUrl.startsWith('https://'),
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/admin/refresh',
      });

      return res.json({ status: 'success', code: 200, data: { token: newToken } });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        return res.json({ status: 'success', code: 200, message: 'If the email exists, a reset link has been sent.' });
      }

      return res.status(501).json({ status: 'error', code: 501, message: 'Password reset is not configured for this database schema.' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      return res.status(501).json({ status: 'error', code: 501, message: 'Password reset is not configured for this database schema.' });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: req.admin!.id },
        select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      return res.json({ status: 'success', code: 200, data: admin });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const admin = await prisma.admin.update({
        where: { id: req.admin!.id },
        data: { email },
        select: { id: true, email: true, role: true },
      });

      await logActivity(req.admin!.id, 'Update Profile', 'admin', {}, req);
      return res.json({ status: 'success', code: 200, data: admin });
    } catch (error) {
      next(error);
    }
  },

  async updatePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Current password and new password are required' });
      }

      const admin = await prisma.admin.findUnique({ where: { id: req.admin!.id } });

      if (!admin) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Admin not found' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Current password is incorrect' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.admin.update({ where: { id: admin.id }, data: { password: passwordHash } });

      await logActivity(req.admin!.id, 'Change Password', 'admin', {}, req);
      return res.json({ status: 'success', code: 200, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  },
};
