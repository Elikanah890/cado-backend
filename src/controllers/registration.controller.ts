import { Request, Response, NextFunction } from 'express';
import { randomInt } from 'crypto';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const normalizePhone = (value: string): string => {
  const digits = String(value || '').replace(/[\s()-]/g, '');
  if (digits.startsWith('+255')) return digits;
  if (digits.startsWith('255')) return `+${digits}`;
  if (digits.startsWith('0')) return `+255${digits.slice(1)}`;
  return digits;
};

const generateRef = async (): Promise<string> => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const ref = `REG-${randomInt(100000, 1000000)}`;
    const existing = await prisma.registration.findUnique({ where: { ref } });
    if (!existing) return ref;
  }
  return `REG-${Date.now().toString().slice(-6)}`;
};

const buildRegistrationData = (body: any, source: string) => ({
  fullName: String(body.fullName || '').trim(),
  email: body.email ? String(body.email).trim() : null,
  phone: normalizePhone(body.phone),
  location: body.location ? String(body.location).trim() : null,
  category: String(body.category || ''),
  itemName: String(body.itemName || '').trim(),
  itemSlug: body.itemSlug ? String(body.itemSlug).trim() : null,
  details: body.details ?? undefined,
  message: body.message ? String(body.message).trim() : null,
  preferredContact: body.preferredContact || 'whatsapp',
  consent: body.consent !== false,
  status: body.status || 'PENDING',
  source,
});

export const registrationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = await generateRef();
      const data = buildRegistrationData(req.body, 'WEBSITE');
      const registration = await prisma.registration.create({
        data: {
          ...data,
          ref,
          status: 'PENDING',
          consent: true,
        },
      });

      return res.status(201).json({
        status: 'success',
        code: 201,
        data: {
          id: registration.id,
          ref: registration.ref,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export const adminRegistrationController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, category, status, page = '1', limit = '20' } = req.query;
      const where: any = {};

      if (category && category !== 'ALL') where.category = String(category);
      if (status && status !== 'ALL') where.status = String(status);

      const term = String(search || '').trim();
      if (term) {
        where.OR = [
          { fullName: { contains: term, mode: 'insensitive' } },
          { ref: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
          { email: { contains: term, mode: 'insensitive' } },
          { itemName: { contains: term, mode: 'insensitive' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

      const [registrations, total] = await Promise.all([
        prisma.registration.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.registration.count({ where }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          registrations,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async stats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [total, pending, confirmed, thisMonth] = await Promise.all([
        prisma.registration.count(),
        prisma.registration.count({ where: { status: 'PENDING' } }),
        prisma.registration.count({ where: { status: { in: ['PAID', 'COMPLETED'] } } }),
        prisma.registration.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: { total, pending, confirmed, thisMonth },
      });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const registration = await prisma.registration.findUnique({ where: { id: req.params.id } });
      if (!registration) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Registration not found' });
      }
      return res.json({ status: 'success', code: 200, data: registration });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, internalNotes } = req.body;
      const data: any = {};
      if (status !== undefined) data.status = status;
      if (internalNotes !== undefined) data.internalNotes = internalNotes || null;

      const registration = await prisma.registration.update({
        where: { id: req.params.id },
        data,
      });

      return res.json({ status: 'success', code: 200, data: registration });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', code: 404, message: 'Registration not found' });
      }
      next(error);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.registration.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Registration deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', code: 404, message: 'Registration not found' });
      }
      next(error);
    }
  },

  async createManual(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ref = await generateRef();
      const data = buildRegistrationData(req.body, 'MANUAL');
      const registration = await prisma.registration.create({
        data: {
          ...data,
          ref,
          status: data.status || 'PENDING',
          internalNotes: req.body.internalNotes || null,
          consent: true,
        },
      });

      return res.status(201).json({ status: 'success', code: 201, data: registration });
    } catch (error) {
      next(error);
    }
  },
};
