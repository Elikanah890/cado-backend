import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const courseController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, level, featured } = req.query;
      const where: any = { isActive: true };
      if (category) where.category = category as string;
      if (level) where.level = level as string;
      if (featured === 'true') where.isFeatured = true;

      const courses = await prisma.course.findMany({
        where,
        include: { _count: { select: { lessons: true } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: courses });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await prisma.course.findFirst({
        where: { slug: req.params.slug, isActive: true },
        include: {
          lessons: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (!course) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Course not found' });
      }
      return res.json({ status: 'success', code: 200, data: course });
    } catch (error) {
      next(error);
    }
  },

  async getLearn(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await prisma.course.findFirst({
        where: { slug: req.params.slug, isActive: true },
        include: {
          lessons: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
      if (!course) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Course not found' });
      }
      return res.json({ status: 'success', code: 200, data: course });
    } catch (error) {
      next(error);
    }
  },
};

export const adminCourseController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courses = await prisma.course.findMany({
        include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: courses });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.price !== undefined && data.price !== '' && data.price !== null) data.price = Number(data.price);
      else if (data.price === '' || data.price === null) data.price = null;
      if (data.estimatedHours !== undefined && data.estimatedHours !== '' && data.estimatedHours !== null) data.estimatedHours = Number(data.estimatedHours);
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      if (data.enrolledCount !== undefined) data.enrolledCount = Number(data.enrolledCount);
      ['isPublished','isFeatured','isActive'].forEach(k => { if (data[k] !== undefined) data[k] = data[k]==='true'?true:data[k]==='false'?false:Boolean(data[k]); });
      if (data.featuredImage === '') data.featuredImage = null;
      if (data.instructor === '') data.instructor = null;
      const course = await prisma.course.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: course });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.price !== undefined && data.price !== '' && data.price !== null) data.price = Number(data.price);
      else if (data.price === '' || data.price === null) data.price = null;
      if (data.estimatedHours !== undefined && data.estimatedHours !== '' && data.estimatedHours !== null) data.estimatedHours = Number(data.estimatedHours);
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      ['isPublished','isFeatured','isActive'].forEach(k => { if (data[k] !== undefined) data[k] = data[k]==='true'?true:data[k]==='false'?false:Boolean(data[k]); });
      if (data.featuredImage === '') data.featuredImage = null;
      if (data.instructor === '') data.instructor = null;
      const course = await prisma.course.update({
        where: { id: req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: course });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.course.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Course deleted' });
    } catch (error) {
      next(error);
    }
  },

  async createLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      const lesson = await prisma.courseLesson.create({
        data: { ...data, courseId: req.params.id },
      });
      return res.status(201).json({ status: 'success', code: 201, data: lesson });
    } catch (error) {
      next(error);
    }
  },

  async updateLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      const lesson = await prisma.courseLesson.update({
        where: { id: req.params.lessonId || req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: lesson });
    } catch (error) {
      next(error);
    }
  },

  async deleteLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.courseLesson.delete({ where: { id: req.params.lessonId || req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Lesson deleted' });
    } catch (error) {
      next(error);
    }
  },
};
