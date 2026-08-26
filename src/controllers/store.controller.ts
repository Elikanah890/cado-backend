import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const storeController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;
      const where: any = { isActive: true };
      if (category) where.category = category as string;

      const products = await prisma.storeProduct.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: products });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await prisma.storeProduct.findFirst({
        where: { slug: req.params.slug, isActive: true },
      });
      if (!product) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Product not found' });
      }
      return res.json({ status: 'success', code: 200, data: product });
    } catch (error) {
      next(error);
    }
  },
};

export const adminStoreController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const products = await prisma.storeProduct.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: products });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.price !== undefined) data.price = Number(data.price);
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.isActive !== undefined) data.isActive = data.isActive==='true'?true:data.isActive==='false'?false:Boolean(data.isActive);
      if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured==='true'?true:data.isFeatured==='false'?false:Boolean(data.isFeatured);
      if (data.category === '') data.category = null;
      if (data.downloadLink === '') data.downloadLink = null;
      if (data.featuredImage === '') data.featuredImage = null;
      const product = await prisma.storeProduct.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: product });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.price !== undefined) data.price = Number(data.price);
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.isActive !== undefined) data.isActive = data.isActive==='true'?true:data.isActive==='false'?false:Boolean(data.isActive);
      if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured==='true'?true:data.isFeatured==='false'?false:Boolean(data.isFeatured);
      if (data.category === '') data.category = null;
      if (data.downloadLink === '') data.downloadLink = null;
      if (data.featuredImage === '') data.featuredImage = null;
      const product = await prisma.storeProduct.update({
        where: { id: req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: product });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.storeProduct.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  },
};
