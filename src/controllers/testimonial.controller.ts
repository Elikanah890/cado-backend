import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const testimonialController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const testimonials = await prisma.testimonial.findMany({
        where: { isApproved: true },
        include: { service: { select: { name: true, slug: true } } },
        orderBy: { sortOrder: 'asc' },
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: testimonials });
    } catch (error) {
      next(error);
    }
  },
};

export const adminTestimonialController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const testimonials = await prisma.testimonial.findMany({
        include: { service: { select: { name: true, slug: true } } },
        orderBy: { sortOrder: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: testimonials });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const testimonial = await prisma.testimonial.create({ data: req.body });
      return res.status(201).json({ status: 'success', code: 201, data: testimonial });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const testimonial = await prisma.testimonial.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ status: 'success', code: 200, data: testimonial });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.testimonial.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Testimonial deleted' });
    } catch (error) {
      next(error);
    }
  },
};
