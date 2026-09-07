import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const periodSummary = async (since: Date, prevStart: Date, prevEnd: Date) => {
  const current = await prisma.visitor.count({ where: { createdAt: { gte: since } } });
  const previous = await prisma.visitor.count({
    where: { createdAt: { gte: prevStart, lt: prevEnd } },
  });
  const changePct = previous === 0
    ? (current > 0 ? 100 : 0)
    : Math.round(((current - previous) / previous) * 100);
  return { current, previous, changePct };
};

export const visitorController = {
  // Public: record a visit (fires from the frontend tracking script)
  async track(req: Request, res: Response, next: NextFunction) {
    try {
      const { path, deviceType, isReturning, visitorId, referrer } = req.body || {};
      const created = await prisma.visitor.create({
        data: {
          path: typeof path === 'string' && path ? path.slice(0, 500) : '/',
          deviceType: deviceType || 'desktop',
          isReturning: isReturning === true,
          visitorId: typeof visitorId === 'string' ? visitorId.slice(0, 200) : null,
          referrer: typeof referrer === 'string' ? referrer.slice(0, 500) : null,
        },
      });
      return res.status(201).json({ status: 'success', code: 201, data: { id: created.id } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: high-level stats (today/week/month/year + comparisons) plus
  // top pages, device breakdown, and new vs returning.
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const windows = [24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000, 30 * 24 * 60 * 60 * 1000, 365 * 24 * 60 * 60 * 1000];
      const [todayWindow, weekWindow, monthWindow, yearWindow] = windows.map((duration) => {
        const since = new Date(now.getTime() - duration);
        return periodSummary(since, new Date(since.getTime() - duration), since);
      });

      const [today, week, month, year] = await Promise.all([todayWindow, weekWindow, monthWindow, yearWindow]);

      const total = await prisma.visitor.count();

      // Top pages (all time, limit 10)
      const topPages = await prisma.visitor.groupBy({
        by: ['path'],
        _count: { _all: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      });

      // Device breakdown (all time)
      const devices = await prisma.visitor.groupBy({
        by: ['deviceType'],
        _count: { _all: true },
      });

      // New vs returning (all time)
      const returning = await prisma.visitor.count({ where: { isReturning: true } });

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({
        status: 'success',
        code: 200,
        data: {
          total,
          periods: { today, week, month, year },
          topPages: topPages.map((p) => ({ path: p.path, count: p._count._all })),
          devices: {
            mobile: devices.find((d) => d.deviceType === 'mobile')?._count._all || 0,
            desktop: devices.find((d) => d.deviceType === 'desktop')?._count._all || 0,
            tablet: devices.find((d) => d.deviceType === 'tablet')?._count._all || 0,
          },
          newVsReturning: {
            new: Math.max(0, total - returning),
            returning,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: line chart data bucketed by day / week / month.
  async getChart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { range = 'month' } = req.query;
      const now = new Date();

      let pointCount: number;
      let spanDays: number;
      let bucketBy: 'day' | 'week' | 'month';

      if (range === 'week') {
        pointCount = 7;
        spanDays = 7;
        bucketBy = 'day';
      } else if (range === 'year') {
        pointCount = 12;
        spanDays = 365;
        bucketBy = 'month';
      } else {
        pointCount = 30;
        spanDays = 30;
        bucketBy = 'day';
      }

      const start = bucketBy === 'month'
        ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate() - (pointCount - 1));
      const rows = await prisma.visitor.groupBy({
        by: ['createdAt'],
        _count: { _all: true },
        where: { createdAt: { gte: start } },
        orderBy: { createdAt: 'asc' },
      });

      const fmtDay = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const keyOf: Record<string, (d: Date) => string> = {
        day: fmtDay,
        month: fmtMonth,
      };
      const bucketKey = keyOf[bucketBy];

      const buckets = new Map<string, number>();
      for (const r of rows) {
        const key = bucketKey(new Date(r.createdAt));
        buckets.set(key, (buckets.get(key) || 0) + r._count._all);
      }

      // Build the label series
      const labels: string[] = [];
      if (bucketBy === 'month') {
        for (let m = 0; m < pointCount; m++) {
          const d = new Date(now.getFullYear(), now.getMonth() - (pointCount - 1) + m, 1);
          labels.push(fmtMonth(d));
        }
      } else {
        for (let i = 0; i < pointCount; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          labels.push(fmtDay(d));
        }
      }

      const data = labels.map((label) => ({ label, value: buckets.get(label) || 0 }));

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: { range: bucketBy, total: data.reduce((s, p) => s + p.value, 0), data } });
    } catch (error) {
      next(error);
    }
  },

  async clearAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { count } = await prisma.visitor.deleteMany({});
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, message: `Deleted ${count} visitor records`, data: { count } });
    } catch (error) {
      next(error);
    }
  },
};