import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sanitizeHtmlContent } from '../utils/sanitize';

const courseInclude = {
  modules: {
    orderBy: { sortOrder: 'asc' as const },
    include: { lessons: { orderBy: { sortOrder: 'asc' as const } } },
  },
};

function coerceCourseScalars(data: any) {
  if (typeof data.description === 'string') data.description = sanitizeHtmlContent(data.description);
  if (data.price !== undefined && data.price !== '' && data.price !== null) data.price = Number(data.price);
  else if (data.price === '' || data.price === null) data.price = null;
  if (data.estimatedHours !== undefined && data.estimatedHours !== '' && data.estimatedHours !== null) data.estimatedHours = Number(data.estimatedHours);
  else if (data.estimatedHours === '' || data.estimatedHours === null) data.estimatedHours = null;
  if (data.sortOrder !== undefined && data.sortOrder !== '') data.sortOrder = Number(data.sortOrder) || 0;
  if (data.enrolledCount !== undefined) data.enrolledCount = Number(data.enrolledCount);
  ['isPublished','isFeatured','isActive'].forEach(k => { if (data[k] !== undefined) data[k] = data[k]==='true'?true:data[k]==='false'?false:Boolean(data[k]); });
  ['featuredImage','thumbnail','introVideo','whatsappNumber','instructor','category','level','description','subtitle','instructorName'].forEach(k => {
    if (data[k] === '') data[k] = null;
  });
}

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
        include: { _count: { select: { modules: true } } },
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
        include: courseInclude,
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
        include: courseInclude,
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
        include: courseInclude,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: courses });
    } catch (error) {
      next(error);
    }
  },

  // Creates a course, optionally with nested modules+lessons in one request.
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body: any = { ...req.body };
      const data: any = { ...body };
      delete data.modules;
      coerceCourseScalars(data);

      const course = await prisma.course.create({ data });

      if (Array.isArray(body.modules)) {
        await saveModules(course.id, body.modules);
      }

      const full = await prisma.course.findUnique({ where: { id: course.id }, include: courseInclude });
      return res.status(201).json({ status: 'success', code: 201, data: full });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body: any = { ...req.body };
      const data: any = { ...body };
      delete data.modules;
      coerceCourseScalars(data);

      const course = await prisma.course.update({ where: { id: req.params.id }, data });

      if (Array.isArray(body.modules)) {
        await saveModules(course.id, body.modules);
      }

      const full = await prisma.course.findUnique({ where: { id: req.params.id }, include: courseInclude });
      return res.json({ status: 'success', code: 200, data: full });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Course not found' });
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.course.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Course deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Course not found' });
      next(error);
    }
  },
};

// ---------- Module CRUD ----------
export const adminModuleController = {
  async createModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined && data.sortOrder !== '') data.sortOrder = Number(data.sortOrder) || 0;
      const module = await prisma.courseModule.create({
        data: { ...data, courseId: req.params.courseId },
      });
      return res.status(201).json({ status: 'success', code: 201, data: module });
    } catch (error) {
      next(error);
    }
  },

  async updateModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (data.sortOrder !== undefined && data.sortOrder !== '') data.sortOrder = Number(data.sortOrder) || 0;
      if (data.title === '') data.title = null;
      const module = await prisma.courseModule.update({
        where: { id: req.params.moduleId || req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: module });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Module not found' });
      next(error);
    }
  },

  async deleteModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.courseModule.delete({ where: { id: req.params.moduleId || req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Module deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Module not found' });
      next(error);
    }
  },
};

// ---------- Lesson CRUD (keyed by module) ----------
export const adminLessonController = {
  async createLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = coerceLesson(req.body);
      const lesson = await prisma.courseLesson.create({
        data: { ...data, moduleId: req.params.moduleId },
      });
      return res.status(201).json({ status: 'success', code: 201, data: lesson });
    } catch (error) {
      next(error);
    }
  },

  async updateLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = coerceLesson(req.body);
      const lesson = await prisma.courseLesson.update({
        where: { id: req.params.lessonId || req.params.id },
        data,
      });
      return res.json({ status: 'success', code: 200, data: lesson });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Lesson not found' });
      next(error);
    }
  },

  async deleteLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.courseLesson.delete({ where: { id: req.params.lessonId || req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Lesson deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Lesson not found' });
      next(error);
    }
  },
};

function coerceLesson(body: any) {
  const data: any = { ...body };
  if (typeof data.content === 'string') data.content = sanitizeHtmlContent(data.content);
  if (data.sortOrder !== undefined && data.sortOrder !== '') data.sortOrder = Number(data.sortOrder) || 0;
  if (data.videoDuration !== undefined && data.videoDuration !== '' && data.videoDuration !== null) data.videoDuration = Number(data.videoDuration) || 0;
  else if (data.videoDuration === '' || data.videoDuration === null) data.videoDuration = null;
  if (data.isFree !== undefined) data.isFree = data.isFree === true || data.isFree === 'true' ? true : data.isFree === false || data.isFree === 'false' ? false : Boolean(data.isFree);
  if (data.moduleId !== undefined && data.moduleId !== '' && data.moduleId !== null) data.moduleId = data.moduleId as string;
  ['videoUrl','description','content'].forEach(k => { if (data[k] === '') data[k] = null; });
  return data;
}

// Reconciles the given modules+lessons array against the persisted course.
async function saveModules(courseId: string, modules: any[]) {
  const existingModules = await prisma.courseModule.findMany({ where: { courseId }, include: { lessons: true } });
  const seenModuleIds = new Set<string>();

  const modulePromises: Promise<any>[] = [];
  for (let m = 0; m < modules.length; m++) {
    const mod = modules[m];
    const sortOrder = m;
    let moduleId: string;

    if (mod.id && existingModules.some((e) => e.id === mod.id)) {
      seenModuleIds.add(mod.id);
      modulePromises.push(
        prisma.courseModule.update({ where: { id: mod.id }, data: { title: mod.title || '', sortOrder } })
      );
      moduleId = mod.id;
    } else {
      const created = await prisma.courseModule.create({
        data: { courseId, title: mod.title || '', sortOrder },
      });
      moduleId = created.id;
    }

    // Reconcile lessons inside this module
    const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
    const existingLessons = existingModules.find((e) => e.id === moduleId)?.lessons || [];
    const seenLessonIds = new Set<string>();

    for (let l = 0; l < lessons.length; l++) {
      const lesson = lessons[l];
      const lessonData = coerceLesson(lesson);
      const payload = {
        title: lessonData.title || '',
        description: lessonData.description ?? undefined,
        videoUrl: lessonData.videoUrl ?? undefined,
        videoDuration: lessonData.videoDuration ?? undefined,
        lessonType: lessonData.lessonType || 'video',
        content: lessonData.content ?? undefined,
        sortOrder: l,
        isFree: lessonData.isFree ?? false,
      };
      if (lesson.id && existingLessons.some((el) => el.id === lesson.id)) {
        seenLessonIds.add(lesson.id);
        modulePromises.push(prisma.courseLesson.update({ where: { id: lesson.id }, data: { ...payload, moduleId } }));
      } else {
        modulePromises.push(prisma.courseLesson.create({ data: { ...payload, moduleId } }));
      }
    }

    // Remove lessons in this module that are no longer present
    const toDeleteLessons = existingLessons.filter((el) => !seenLessonIds.has(el.id));
    for (const del of toDeleteLessons) {
      modulePromises.push(prisma.courseLesson.delete({ where: { id: del.id } }));
    }
  }

  // Remove modules that are no longer present (cascades their lessons)
  const toDeleteModules = existingModules.filter((e) => !seenModuleIds.has(e.id));
  for (const del of toDeleteModules) {
    modulePromises.push(prisma.courseModule.delete({ where: { id: del.id } }));
  }

  await Promise.all(modulePromises);
}