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

export const storeProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.number().min(0),
  currency: z.string().optional().default('TZS'),
  fileUrl: z.string().optional().nullable(),
  fileSize: z.string().optional().nullable(),
  previewImages: z.any().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  galleryImages: z.any().optional().nullable(),
  downloadLink: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
  seo: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
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
  price: z.number().min(0).optional().nullable(),
  currency: z.string().optional().default('TZS'),
  level: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  instructor: z.string().optional().nullable(),
  seo: z.any().optional().nullable(),
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
  clientCompany: z.string().optional(),
  clientAvatar: z.string().optional(),
  content: z.string().min(10),
  rating: z.number().min(1).max(5).optional(),
  serviceId: z.string().optional(),
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
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
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
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  videoDuration: z.number().optional(),
  lessonType: z.string().default('video'),
  content: z.string().optional(),
  sortOrder: z.number().optional(),
  isFree: z.boolean().optional(),
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
