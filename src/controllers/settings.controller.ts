import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { settingsService } from '../services/settings.service';

export const settingsController = {
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getAll();
      return res.json({ status: 'success', code: 200, data: settings });
    } catch (error) {
      next(error);
    }
  },
};

export const adminSettingsController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getAll();
      return res.json({ status: 'success', code: 200, data: settings });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { settings } = req.body;
      await settingsService.setMany(settings);
      const updated = await settingsService.getAll();
      return res.json({ status: 'success', code: 200, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async getByGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.get(req.params.group);
      return res.json({ status: 'success', code: 200, data: settings });
    } catch (error) {
      next(error);
    }
  },
};
