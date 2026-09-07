import { z } from 'zod';

export const blogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  excerpt: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  galleryImages: z.array(z.any()).optional(),
  categoryId: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional().default('draft'),
  publishedAt: z.any().optional().nullable(),
  scheduledAt: z.any().optional().nullable(),
  sortOrder: z.number().optional(),
  seo: z.any().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
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

export const createCommentSchema = z.object({
  name: z.string().min(1).refine((v) => v.trim().length > 0, { message: 'Name is required' }),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  content: z.string().min(1).refine((v) => v.trim().length > 0, { message: 'Comment is required' }),
});