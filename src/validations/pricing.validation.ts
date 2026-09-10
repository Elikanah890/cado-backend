import { z } from 'zod';

export const pricingCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const pricingPlanSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be >= 0'),
  currency: z.string().optional().default('TZS'),
  period: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  isPopular: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});
