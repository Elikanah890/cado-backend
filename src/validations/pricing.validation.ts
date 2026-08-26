import { z } from 'zod';

export const pricingPlanSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  tagline: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be >= 0'),
  currency: z.string().optional().default('TZS'),
  features: z.array(z.string()).optional().default([]),
  isPopular: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

export const hostingPlanSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be >= 0'),
  currency: z.string().optional().default('TZS'),
  billingPeriod: z.string().optional().default('yearly'),
  period: z.string().optional(),
  features: z.array(z.string()).optional().default([]),
  isPopular: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

export const customServiceSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be >= 0'),
  currency: z.string().optional().default('TZS'),
  features: z.array(z.string()).optional().default([]),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});
