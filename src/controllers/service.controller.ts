import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const serviceController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        include: { packages: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: services });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await prisma.service.findUnique({
        where: { slug: req.params.slug, isActive: true },
        include: { packages: { orderBy: { sortOrder: 'asc' } } },
      });
      if (!service) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Service not found' });
      }
      return res.json({ status: 'success', code: 200, data: service });
    } catch (error) {
      next(error);
    }
  },
};

export const adminServiceController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const services = await prisma.service.findMany({
        include: { packages: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: services });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.startingPrice !== undefined) data.startingPrice = data.startingPrice === '' || data.startingPrice === null ? null : Number(data.startingPrice);
      if (data.sortOrder !== undefined) data.sortOrder = data.sortOrder === '' || data.sortOrder === null ? null : Number(data.sortOrder);
      if (data.isActive !== undefined) data.isActive = data.isActive === 'true' ? true : data.isActive === 'false' ? false : Boolean(data.isActive);
      const service = await prisma.service.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: service });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.startingPrice !== undefined) data.startingPrice = data.startingPrice === '' || data.startingPrice === null ? null : Number(data.startingPrice);
      if (data.sortOrder !== undefined) data.sortOrder = data.sortOrder === '' || data.sortOrder === null ? null : Number(data.sortOrder);
      if (data.isActive !== undefined) data.isActive = data.isActive === 'true' ? true : data.isActive === 'false' ? false : Boolean(data.isActive);
      const service = await prisma.service.update({
        where: { id: req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: service });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.service.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Service deleted' });
    } catch (error) {
      next(error);
    }
  },

  async createPackage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pkg = await prisma.servicePackage.create({
        data: { ...req.body, serviceId: req.params.id },
      });
      return res.status(201).json({ status: 'success', code: 201, data: pkg });
    } catch (error) {
      next(error);
    }
  },

  async updatePackage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pkg = await prisma.servicePackage.update({
        where: { id: req.params.packageId },
        data: req.body,
      });
      return res.json({ status: 'success', code: 200, data: pkg });
    } catch (error) {
      next(error);
    }
  },

  async deletePackage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.servicePackage.delete({ where: { id: req.params.packageId } });
      return res.json({ status: 'success', code: 200, message: 'Package deleted' });
    } catch (error) {
      next(error);
    }
  },
};
