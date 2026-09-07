import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import {
  hashPassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/auth';
import { AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../middleware/activityLogger';
import { storeRefreshToken, consumeRefreshToken, revokeRefreshToken } from '../../services/refreshToken.service';
import { isWeakPassword } from '../../utils/passwordPolicy';

const COOKIE_BASE = { httpOnly: true, secure: true, sameSite: 'none' as const };
const ACCESS_MAX_AGE = 24 * 60 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_PATH = '/api/admin';

function setAuthCookies(res: Response, token: string, refreshToken: string) {
  res.cookie('auth_token', token, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_BASE,
    maxAge: REFRESH_MAX_AGE,
    path: REFRESH_COOKIE_PATH,
  });
}

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
        select: { id: true, email: true, password: true, role: true, tokenVersion: true },
      });
      if (!admin) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid credentials' });
      }

      const payload = { id: admin.id, email: admin.email, role: admin.role, tokenVersion: admin.tokenVersion };
      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);

      const refreshJti = verifyRefreshToken(refreshToken).jti as string | undefined;
      if (refreshJti) await storeRefreshToken(refreshJti, admin.id);

      setAuthCookies(res, token, refreshToken);

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
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        try {
          const decoded = verifyRefreshToken(refreshToken);
          if (decoded?.jti) await revokeRefreshToken(decoded.jti);
        } catch (_) {}
      }

      res.clearCookie('auth_token', COOKIE_BASE);
      res.clearCookie('refresh_token', { ...COOKIE_BASE, path: REFRESH_COOKIE_PATH });
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
      if (decoded.type !== 'refresh' || !decoded.jti) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid token' });
      }

      // Single-use rotation: reject if the jti has already been consumed.
      const isConsumed = await consumeRefreshToken(decoded.jti, decoded.id);
      if (!isConsumed) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid token' });
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, tokenVersion: true },
      });
      if (!admin || decoded.tokenVersion !== admin.tokenVersion) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Invalid token' });
      }

      const payload = { id: admin.id, email: admin.email, role: admin.role, tokenVersion: admin.tokenVersion };
      const newToken = generateToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      const newJti = verifyRefreshToken(newRefreshToken).jti as string | undefined;
      if (newJti) await storeRefreshToken(newJti, admin.id);

      setAuthCookies(res, newToken, newRefreshToken);

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

      if (isWeakPassword(newPassword)) {
        return res.status(400).json({ status: 'error', code: 400, message: 'New password is too weak. Use a longer, non-default password.' });
      }

      const admin = await prisma.admin.findUnique({ where: { id: req.admin!.id } });

      if (!admin) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Admin not found' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Current password is incorrect' });
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: passwordHash, tokenVersion: { increment: 1 } },
      });

      await logActivity(req.admin!.id, 'Change Password', 'admin', {}, req);
      return res.json({ status: 'success', code: 200, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  },
};
