import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sanitizeHtmlContent } from '../utils/sanitize';

function slugify(str: string) {
  return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function calculateReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function estimateReadTime(html: string): number {
  return calculateReadTime(html || '');
}

export const blogController = {
  async getAllPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, tag, search, page = '1', limit = '12' } = req.query;
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      const where: any = { status: 'published' };

      if (category) {
        const cat = await prisma.blogCategory.findUnique({ where: { slug: category as string } });
        if (cat) where.categoryId = cat.id;
        else where.categoryId = 'non-existent';
      }
      if (tag) {
        where.tags = { some: { tag: { name: tag as string } } };
      }
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { excerpt: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            category: true,
            tags: { include: { tag: true } },
            _count: { select: { comments: true } },
            comments: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              take: 2,
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          posts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await prisma.blogPost.findFirst({
        where: { slug: req.params.slug, status: 'published' },
        include: {
          category: true,
          tags: { include: { tag: true } },
          comments: { where: { isApproved: true }, orderBy: { createdAt: 'desc' } },
        },
      });
      if (!post) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      }

      await prisma.blogPost.update({
        where: { id: post.id },
        data: { views: { increment: 1 }, viewCount: { increment: 1 } },
      });

      return res.json({ status: 'success', code: 200, data: { ...post, views: post.views + 1, viewCount: post.viewCount + 1 } });
    } catch (error) {
      next(error);
    }
  },

  async getRelatedPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await prisma.blogPost.findFirst({
        where: { slug: req.params.slug, status: 'published' },
        include: { tags: { include: { tag: true } } },
      });
      if (!post) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      }

      const tagIds = post.tags.map((t) => t.tagId);
      const related = await prisma.blogPost.findMany({
        where: {
          id: { not: post.id },
          status: 'published',
          OR: [
            { categoryId: post.categoryId ? post.categoryId : undefined },
            { tags: { some: { tagId: { in: tagIds } } } },
          ],
        },
        include: { category: true, tags: { include: { tag: true } } },
        orderBy: { publishedAt: 'desc' },
        take: 4,
      });

      return res.json({ status: 'success', code: 200, data: related });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.blogCategory.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { name: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await prisma.blogTag.findMany({
        include: { _count: { select: { posts: true } } as any },
        orderBy: { name: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: tags });
    } catch (error) {
      next(error);
    }
  },

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await prisma.blogPost.findFirst({
        where: { slug: req.params.slug, status: 'published' },
      });
      if (!post) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      }

      const comments = await prisma.comment.findMany({
        where: { postId: post.id, isApproved: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ status: 'success', code: 200, data: comments });
    } catch (error) {
      next(error);
    }
  },

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, content } = req.body;
      const post = await prisma.blogPost.findFirst({
        where: { slug: req.params.slug, status: 'published' },
      });
      if (!post) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      }

      const comment = await prisma.comment.create({
        data: { name, email, content, postId: post.id },
      });
      return res.status(201).json({ status: 'success', code: 201, data: comment });
    } catch (error) {
      next(error);
    }
  },
};

export const adminBlogController = {
  async getAllPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posts = await prisma.blogPost.findMany({
        include: { category: true, tags: { include: { tag: true } }, _count: { select: { comments: true } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: posts });
    } catch (error) {
      next(error);
    }
  },

  async getPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { id: req.params.id },
        include: { category: true, tags: { include: { tag: true } }, _count: { select: { comments: true } } },
      });
      if (!post) return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      return res.json({ status: 'success', code: 200, data: post });
    } catch (error) {
      next(error);
    }
  },

  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tags, ...postDataRaw } = req.body;
      const postData: any = { ...postDataRaw };

      if (typeof postData.content === 'string') postData.content = sanitizeHtmlContent(postData.content);
      if (postData.publishedAt) postData.publishedAt = new Date(postData.publishedAt);
      if (postData.publishedAt === '' || postData.publishedAt === null) postData.publishedAt = postData.status === 'published' ? new Date() : null;
      if (postData.scheduledAt) postData.scheduledAt = new Date(postData.scheduledAt);
      if (postData.scheduledAt === '') postData.scheduledAt = null;
      if (postData.sortOrder !== undefined) postData.sortOrder = Number(postData.sortOrder) || 0;
      if (postData.viewCount !== undefined) postData.viewCount = Number(postData.viewCount) || 0;
      if (postData.categoryId === '') postData.categoryId = null;
      if (postData.content) postData.readTime = estimateReadTime(postData.content);

      const post = await prisma.blogPost.create({
        data: {
          ...postData,
          tags: tags
            ? {
                create: await Promise.all(
                  tags.map(async (tagName: string) => {
                    const tag = await prisma.blogTag.upsert({
                      where: { name: tagName },
                      update: {},
                      create: { name: tagName, slug: slugify(tagName) },
                    });
                    return { tagId: tag.id };
                  })
                ),
              }
            : undefined,
        },
        include: { category: true, tags: { include: { tag: true } } },
      });
      return res.status(201).json({ status: 'success', code: 201, data: post });
    } catch (error) {
      next(error);
    }
  },

  async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tags, ...postDataRaw } = req.body;
      const postData: any = { ...postDataRaw };

      if (typeof postData.content === 'string') postData.content = sanitizeHtmlContent(postData.content);
      if (postData.publishedAt) postData.publishedAt = new Date(postData.publishedAt);
      if (postData.publishedAt === '' || postData.publishedAt === null) postData.publishedAt = null;
      if (postData.scheduledAt) postData.scheduledAt = new Date(postData.scheduledAt);
      if (postData.scheduledAt === '') postData.scheduledAt = null;
      if (postData.sortOrder !== undefined) postData.sortOrder = Number(postData.sortOrder) || 0;
      if (postData.categoryId === '') postData.categoryId = null;
      if (postData.content) postData.readTime = estimateReadTime(postData.content);

      if (tags) {
        await prisma.blogPostTag.deleteMany({ where: { postId: req.params.id } });
      }

      const post = await prisma.blogPost.update({
        where: { id: req.params.id },
        data: {
          ...postData,
          tags: tags
            ? {
                create: await Promise.all(
                  tags.map(async (tagName: string) => {
                    const tag = await prisma.blogTag.upsert({
                      where: { name: tagName },
                      update: {},
                      create: { name: tagName, slug: slugify(tagName) },
                    });
                    return { tagId: tag.id };
                  })
                ),
              }
            : undefined,
        },
        include: { category: true, tags: { include: { tag: true } } },
      });
      return res.json({ status: 'success', code: 200, data: post });
    } catch (error) {
      next(error);
    }
  },

  async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.comment.deleteMany({ where: { postId: id } });
      await prisma.blogPostTag.deleteMany({ where: { postId: id } });
      await prisma.blogPost.delete({ where: { id } });
      return res.json({ status: 'success', code: 200, message: 'Post deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      next(error);
    }
  },

  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.blogCategory.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { name: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (!data.slug) data.slug = slugify(data.name);
      const category = await prisma.blogCategory.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: category });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await prisma.blogCategory.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json({ status: 'success', code: 200, data: category });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.blogPost.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
      await prisma.blogCategory.delete({ where: { id } });
      return res.json({ status: 'success', code: 200, message: 'Category deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Category not found' });
      if (error.code === 'P2003') return res.status(400).json({ status: 'error', code: 400, message: 'Cannot delete category with existing posts. Remove category from posts first.' });
      next(error);
    }
  },

  async getTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tags = await prisma.blogTag.findMany({
        orderBy: { name: 'asc' },
      });
      return res.json({ status: 'success', code: 200, data: tags });
    } catch (error) {
      next(error);
    }
  },

  async createTag(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: any = { ...req.body };
      if (!data.slug) data.slug = slugify(data.name);
      const tag = await prisma.blogTag.create({ data });
      return res.status(201).json({ status: 'success', code: 201, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async updateTag(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tag = await prisma.blogTag.update({ where: { id: req.params.id }, data: req.body });
      return res.json({ status: 'success', code: 200, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async deleteTag(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.blogPostTag.deleteMany({ where: { tagId: id } });
      await prisma.blogTag.delete({ where: { id } });
      return res.json({ status: 'success', code: 200, message: 'Tag deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', code: 404, message: 'Tag not found' });
      next(error);
    }
  },

  async getAllComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.query;
      const where: any = {};
      if (postId) where.postId = postId as string;

      const comments = await prisma.comment.findMany({
        where,
        include: { post: { select: { title: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ status: 'success', code: 200, data: comments });
    } catch (error) {
      next(error);
    }
  },

  async approveComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await prisma.comment.update({
        where: { id: req.params.id },
        data: { isApproved: true },
      });
      return res.json({ status: 'success', code: 200, data: comment });
    } catch (error) {
      next(error);
    }
  },

  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.comment.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Comment deleted' });
    } catch (error) {
      next(error);
    }
  },
};
