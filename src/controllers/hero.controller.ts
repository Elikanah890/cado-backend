import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const HERO_ID = 'main_hero';

export const DEFAULT_HERO = {
  id: HERO_ID,
  tagline: 'Build. Market. Automate. Grow.',
  heading: 'We Build Brands & Smart Systems That Drive Real Growth.',
  subtext: 'Tailored digital solutions for ambitious businesses in Tanzania and beyond.',
  primaryButtonText: 'Chat on WhatsApp',
  primaryButtonUrl: 'https://wa.me/255716168903',
  secondaryButtonText: 'View Portfolio',
  secondaryButtonUrl: '/portfolio',
  stat1Value: '6+',
  stat1Label: 'Happy Clients',
  stat2Value: '10+',
  stat2Label: 'Projects Delivered',
  heroImages: [
    '/hero/hero1.jpeg',
    '/hero/hero2.jpeg',
    '/hero/hero3.jpeg',
    '/hero/hero4.jpeg',
    '/hero/hero5.jpeg',
    '/hero/hero6.jpeg',
  ],
};

const STRING_FIELDS = [
  'tagline',
  'heading',
  'subtext',
  'primaryButtonText',
  'primaryButtonUrl',
  'secondaryButtonText',
  'secondaryButtonUrl',
  'stat1Value',
  'stat1Label',
  'stat2Value',
  'stat2Label',
] as const;

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((image) => typeof image === 'string' ? image : image?.url || '')
    .filter((image): image is string => Boolean(image));
}

export async function getHeroSetting() {
  const existing = await prisma.heroSetting.findUnique({ where: { id: HERO_ID } });
  if (existing) return existing;

  try {
    return await prisma.heroSetting.create({
      data: { ...DEFAULT_HERO, heroImages: DEFAULT_HERO.heroImages },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const row = await prisma.heroSetting.findUnique({ where: { id: HERO_ID } });
      if (row) return row;
    }
    throw error;
  }
}

function coerceHero(body: any, existing: any) {
  const data: any = {};

  for (const field of STRING_FIELDS) {
    data[field] = typeof body?.[field] === 'string' ? body[field] : existing[field];
  }

  data.heroImages = body?.heroImages !== undefined
    ? normalizeImages(body.heroImages)
    : normalizeImages(existing.heroImages);

  return data;
}

export const heroController = {
  async getHero(_req: Request, res: Response, next: NextFunction) {
    try {
      const hero = await getHeroSetting();
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.json({ status: 'success', code: 200, data: hero });
    } catch (error) {
      next(error);
    }
  },
};

export const adminHeroController = {
  async getHero(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const hero = await getHeroSetting();
      return res.json({ status: 'success', code: 200, data: hero });
    } catch (error) {
      next(error);
    }
  },

  async updateHero(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await getHeroSetting();
      const data = coerceHero(req.body, existing);

      const hero = await prisma.heroSetting.upsert({
        where: { id: HERO_ID },
        update: data,
        create: { ...DEFAULT_HERO, ...data, id: HERO_ID },
      });

      return res.json({ status: 'success', code: 200, data: hero });
    } catch (error) {
      next(error);
    }
  },
};
