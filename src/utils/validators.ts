import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceNeeded: z.string().optional(),
  budgetRange: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const serviceSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  overview: z.string().optional(),
  benefits: z.any().optional(),
  process: z.any().optional(),
  icon: z.string().optional(),
  featuredImage: z.string().optional(),
  startingPrice: z.number().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const portfolioSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  clientName: z.string().optional().nullable(),
  clientLogo: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  projectUrl: z.string().optional().nullable(),
  challenge: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  results: z.string().optional().nullable(),
  testimonialText: z.string().optional().nullable(),
  testimonialAuthor: z.string().optional().nullable(),
  testimonialPosition: z.string().optional().nullable(),
  clientTestimonial: z.any().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  techStack: z.array(z.string()).optional(),
  status: z.enum(['COMPLETED', 'IN_PROGRESS']).optional(),
  completionDate: z.any().optional().nullable(),
  sortOrder: z.number().optional(),
  seo: z.any().optional().nullable(),
  servicesProvided: z.any().optional().nullable(),
  resultMetrics: z.any().optional().nullable(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.any().optional().nullable(),
});

export const courseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  instructorName: z.string().optional().nullable(),
  instructorBio: z.string().optional().nullable(),
  instructorAvatar: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  introVideo: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  price: z.union([
    z.number().min(0),
    z.string().transform((v) => (v === '' || v.trim() === '' ? null : Number(v))),
    z.null(),
    z.undefined(),
  ]).optional(),
  currency: z.string().optional().default('TZS'),
  level: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  estimatedHours: z.union([
    z.number(),
    z.string().transform((v) => (v === '' || v.trim() === '' ? null : Number(v))),
    z.null(),
    z.undefined(),
  ]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.union([z.number(), z.string().transform((v) => Number(v)), z.undefined()]).optional(),
  instructor: z.string().optional().nullable(),
  seo: z.any().optional().nullable(),
  modules: z.any().optional(),
});

export const courseModuleSchema = z.object({
  title: z.string().min(1),
  sortOrder: z.union([z.number(), z.string().transform((v) => Number(v)), z.null(), z.undefined()]).optional(),
});

export const blogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  content: z.string().default(''),
  featuredImage: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  publishedAt: z.any().optional().nullable(),
  tags: z.array(z.string()).optional(),
  viewCount: z.number().optional(),
  sortOrder: z.number().optional(),
  seo: z.any().optional().nullable(),
});

export const blogCategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const blogTagSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
});

export const testimonialSchema = z.object({
  clientName: z.string().min(1),
  clientCompany: z.string().optional().nullable(),
  clientAvatar: z.string().optional().nullable(),
  content: z.string().min(10),
  rating: z.number().min(1).max(5).optional(),
  serviceId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceNeeded: z.string().optional(),
  budgetRange: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export const settingsSchema = z.object({
  settings: z.record(z.string(), z.string().nullable()),
});

export const adminProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  profileImage: z.string().optional(),
});

export const adminPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be at most 128 characters')
    .regex(/[A-Za-z]/, 'New password must contain a letter')
    .regex(/[0-9]/, 'New password must contain a number'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const servicePackageSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().default('TZS'),
  features: z.any().optional(),
  isHighlighted: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const courseLessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  videoDuration: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v))), z.null(), z.undefined()]).optional(),
  lessonType: z.string().optional().default('video'),
  content: z.string().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  sortOrder: z.union([z.number(), z.string().transform((v) => Number(v)), z.null(), z.undefined()]).optional(),
  isFree: z.union([z.boolean(), z.string().transform((v) => v === 'true'), z.null(), z.undefined()]).optional(),
});

export const hostingPlanSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('TZS'),
  billingPeriod: z.string().default('yearly'),
  features: z.any().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});
