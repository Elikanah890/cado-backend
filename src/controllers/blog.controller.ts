import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

function slugify(str: string) {
  return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
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
        ];
      }

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: { category: true, tags: { include: { tag: true } } },
          orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.blogPost.count({ where }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          posts,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
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
        include: { category: true, tags: { include: { tag: true } } },
      });
      if (!post) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Post not found' });
      }

      await prisma.blogPost.update({
        where: { id: post.id },
        data: { views: { increment: 1 }, viewCount: { increment: 1 } },
      });

      return res.json({ status: 'success', code: 200, data: { ...post, views: post.views + 1, viewCount: (post as any).viewCount + 1 } });
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
};

export const adminBlogController = {
  async getAllPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posts = await prisma.blogPost.findMany({
        include: { category: true, tags: { include: { tag: true } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json({ status: 'success', code: 200, data: posts });
    } catch (error) {
      next(error);
    }
  },

  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tags, ...postDataRaw } = req.body;
      const postData: any = { ...postDataRaw };
      if (postData.publishedAt) postData.publishedAt = new Date(postData.publishedAt);
      if (postData.publishedAt === '') postData.publishedAt = null;
      if (postData.sortOrder !== undefined) postData.sortOrder = Number(postData.sortOrder) || 0;
      if (postData.viewCount !== undefined) postData.viewCount = Number(postData.viewCount) || 0;
      if (postData.categoryId === '') postData.categoryId = null;
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
      if (postData.publishedAt) postData.publishedAt = new Date(postData.publishedAt);
      if (postData.publishedAt === '') postData.publishedAt = null;
      if (postData.sortOrder !== undefined) postData.sortOrder = Number(postData.sortOrder) || 0;
      if (postData.categoryId === '') postData.categoryId = null;

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
      await prisma.blogPost.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Post deleted' });
    } catch (error) {
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
      await prisma.blogCategory.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Category deleted' });
    } catch (error) {
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
      await prisma.blogTag.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Tag deleted' });
    } catch (error) {
      next(error);
    }
  },
};
