import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, emailTemplates } from '../services/email.service';

export const leadController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await prisma.lead.create({ data: { ...req.body, source: 'website' } });

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@cador.digital',
        subject: `New Lead: ${lead.firstName} ${lead.lastName}`,
        html: emailTemplates.contactReceived({
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          message: lead.message || `Service needed: ${lead.serviceNeeded || 'Not specified'}`,
        }),
      });

      return res.status(201).json({ status: 'success', code: 201, data: lead });
    } catch (error) {
      next(error);
    }
  },

  async newsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const existing = await prisma.lead.findFirst({
        where: { email, source: 'newsletter' },
      });
      if (!existing) {
        await prisma.lead.create({
          data: {
            firstName: 'Subscriber',
            lastName: '',
            email,
            source: 'newsletter',
            status: 'new',
          },
        });
      }
      return res.json({ status: 'success', code: 200, message: 'Subscribed successfully' });
    } catch (error) {
      next(error);
    }
  },
};

export const adminLeadController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page = '1', limit = '20' } = req.query;
      const where: any = {};
      if (status) where.status = status as string;
      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.lead.count({ where }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          leads,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
      if (!lead) return res.status(404).json({ status: 'error', code: 404, message: 'Lead not found' });
      return res.json({ status: 'success', code: 200, data: lead });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await prisma.lead.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ status: 'success', code: 200, data: lead });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.lead.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Lead deleted' });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [total, newLeads, contacted, closed] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'new' } }),
        prisma.lead.count({ where: { status: 'contacted' } }),
        prisma.lead.count({ where: { status: 'closed' } }),
      ]);

      return res.json({ status: 'success', code: 200, data: { total, new: newLeads, contacted, closed } });
    } catch (error) {
      next(error);
    }
  },
};
