import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ---------- PUBLIC ----------
export const pricingPublicController = {
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
  async getHosting(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.hostingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: plans });
    } catch (error) { next(error); }
  },
  async getCustom(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await prisma.customService.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: services });
    } catch (error) { next(error); }
  },
};

// ---------- ADMIN: Pricing Plans ----------
export const adminPricingPlanController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.pricingPlan.findMany({ orderBy: { sortOrder: 'asc' } });
      return res.json({ status: 'success', code: 200, data: plans });
    } catch (error) { next(error); }
  },
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      const plan = await prisma.pricingPlan.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: plan });
    } catch (error) { next(error); }
  },
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
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

// ---------- ADMIN: Hosting Plans ----------
export const adminHostingPlanController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.hostingPlan.findMany({ orderBy: { sortOrder: 'asc' } });
      return res.json({ status: 'success', code: 200, data: plans });
    } catch (error) { next(error); }
  },
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      // Handle period alias
      if (data.period && !data.billingPeriod) data.billingPeriod = data.period;
      const plan = await prisma.hostingPlan.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: plan });
    } catch (error) { next(error); }
  },
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      if (data.period && !data.billingPeriod) data.billingPeriod = data.period;
      const plan = await prisma.hostingPlan.update({ where: { id: req.params.id }, data });
      return res.json({ status: 'success', code: 200, data: plan });
    } catch (error) { next(error); }
  },
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.hostingPlan.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Hosting plan deleted' });
    } catch (error) { next(error); }
  },
};

// ---------- ADMIN: Custom Services ----------
export const adminCustomServiceController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const services = await prisma.customService.findMany({ orderBy: { sortOrder: 'asc' } });
      return res.json({ status: 'success', code: 200, data: services });
    } catch (error) { next(error); }
  },
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      const service = await prisma.customService.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: service });
    } catch (error) { next(error); }
  },
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.price !== undefined) data.price = Number(data.price);
      const service = await prisma.customService.update({ where: { id: req.params.id }, data });
      return res.json({ status: 'success', code: 200, data: service });
    } catch (error) { next(error); }
  },
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.customService.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Custom service deleted' });
    } catch (error) { next(error); }
  },
};
