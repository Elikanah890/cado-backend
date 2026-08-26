import { prisma } from '../config/database';
import { config } from '../config';

const defaultSettings: Record<string, string> = {
  company_name: 'CadorDigital',
  company_email: 'admin@cador.digital',
  company_phone: '+255 716 168 903',
  company_address: 'Mbeya, Tanzania',
  company_logo: '',
  social_facebook: 'https://facebook.com/cadordigital',
  social_instagram: 'https://instagram.com/cadordigital',
  social_linkedin: 'https://linkedin.com/company/cadordigital',
  social_twitter: 'https://twitter.com/cadordigital',
  social_youtube: '',
  seo_title: 'CadorDigital - Build. Market. Automate. Grow.',
  seo_description: 'CadorDigital helps startups, companies and organizations build professional brands, websites, marketing systems and automation solutions.',
  seo_keywords: 'digital agency, tanzania, web development, branding, digital marketing, AI, automation',
  site_currency: 'TZS',
  google_maps_location: '',
  whatsapp_number: '+255716168903',
};

export const settingsService = {
  async get(group: string): Promise<Record<string, string | null>> {
    const settings = await prisma.setting.findMany({
      where: { group },
    });

    const result: Record<string, string | null> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  },

  async getAll(): Promise<Record<string, string | null>> {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string | null> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    for (const [key, value] of Object.entries(defaultSettings)) {
      if (!(key in result)) {
        result[key] = value;
      }
    }

    return result;
  },

  async getValue(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (setting) return setting.value;

    return defaultSettings[key] || null;
  },

  async set(key: string, value: string, group: string = 'general'): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group },
    });
  },

  async setMany(settings: Record<string, string | null>, group: string = 'general'): Promise<void> {
    const keyToGroup: Record<string, string> = {
      company_name: 'company', company_tagline: 'company', company_description: 'company',
      company_email: 'company', company_phone: 'company', company_address: 'company', company_logo: 'company',
      social_facebook: 'social', social_instagram: 'social', social_linkedin: 'social',
      social_twitter: 'social', social_youtube: 'social', whatsapp_number: 'social',
      facebook_url: 'social', instagram_url: 'social', twitter_url: 'social',
      linkedin_url: 'social', youtube_url: 'social',
      seo_title: 'seo', seo_description: 'seo', seo_keywords: 'seo',
      google_analytics_id: 'analytics',
    };

    const operations = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: keyToGroup[key] || group },
      })
    );
    await Promise.all(operations);
  },
};
