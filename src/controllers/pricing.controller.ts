import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ---------- PUBLIC ----------
export const pricingPublicController = {
  async getPricing(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.pricingCategory.findMany({
        where: { isActive: true },
        include: { plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: { categories } });
    } catch (error) { next(error); }
  },
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.pricingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: plans });
    } catch (error) { next(error); }
  },
};

// ---------- ADMIN: Pricing Plans ----------
export const adminPricingPlanController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.pricingPlan.findMany({
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { sortOrder: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: plans });
    } catch (error) { next(error); }
  },
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      if (data.period === '') data.period = null;
      if (data.features && !Array.isArray(data.features)) data.features = [];
      const plan = await prisma.pricingPlan.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: plan });
    } catch (error) { next(error); }
  },
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      if (data.period === '') data.period = null;
      if (data.features && !Array.isArray(data.features)) data.features = [];
      const plan = await prisma.pricingPlan.update({ where: { id: req.params.id }, data });
      return res.json({ status: 'success', code: 200, data: plan });
    } catch (error) { next(error); }
  },
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.pricingPlan.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Pricing plan deleted' });
    } catch (error) { next(error); }
  },
};

// ---------- ADMIN: Pricing Categories ----------
export const adminPricingCategoryController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.pricingCategory.findMany({
        include: { _count: { select: { plans: true } } },
        orderBy: { sortOrder: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: categories });
    } catch (error) { next(error); }
  },
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      const category = await prisma.pricingCategory.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: category });
    } catch (error) { next(error); }
  },
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      const category = await prisma.pricingCategory.update({ where: { id: req.params.id }, data });
      return res.json({ status: 'success', code: 200, data: category });
    } catch (error) { next(error); }
  },
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.pricingCategory.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Pricing category deleted' });
    } catch (error) { next(error); }
  },
};
