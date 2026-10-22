import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

function coerceProduct(body: any) {
  const data: any = { ...body };

  data.price = Number(data.price) || 0;
  data.sortOrder = Number(data.sortOrder) || 0;
  data.isActive = data.isActive === true || data.isActive === 'true'
    ? true
    : data.isActive === false || data.isActive === 'false'
      ? false
      : true;

  if (typeof data.description !== 'string') data.description = '';
  if (typeof data.currency !== 'string' || data.currency.trim() === '') data.currency = 'TZS';

  if (!Array.isArray(data.images)) {
    data.images = [];
  } else {
    data.images = data.images
      .map((image: any) => typeof image === 'string'
        ? { url: image, alt: '' }
        : { url: image?.url || '', alt: image?.alt || '' })
      .filter((image: any) => image.url);
  }

  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  return data;
}

export const productController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
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
      const product = await prisma.product.findFirst({
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

export const adminProductController = {
  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: products });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (!product) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Product not found' });
      }
      return res.json({ status: 'success', code: 200, data: product });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = coerceProduct(req.body);
      const product = await prisma.product.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: product });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ status: 'error', code: 409, message: 'A product with this slug already exists' });
      }
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = coerceProduct(req.body);
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: product });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', code: 404, message: 'Product not found' });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({ status: 'error', code: 409, message: 'A product with this slug already exists' });
      }
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Product deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', code: 404, message: 'Product not found' });
      }
      next(error);
    }
  },
};
