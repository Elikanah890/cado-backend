import { z } from 'zod';

export const blogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  excerpt: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  publishedAt: z.any().optional().nullable(),
  sortOrder: z.number().optional(),
  seo: z.any().optional().nullable(),
});

export const blogCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const blogTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});