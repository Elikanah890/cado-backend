import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { uploadFile } from '../services/upload.service';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
];

const ALLOWED_FOLDERS = ['general', 'services', 'portfolio', 'blog', 'courses', 'course', 'team', 'settings'];

function sanitizeFolder(folder: string): string {
  const normalized = path.normalize(folder).replace(/^(\.\.(\/|\\|$))+/, '');
  const basename = path.basename(normalized);
  return ALLOWED_FOLDERS.includes(basename) ? basename : 'general';
}

export const mediaController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { folder, type, page = '1', limit = '50' } = req.query;
      const where: any = {};
      if (folder) where.folder = folder as string;
      if (type) where.fileType = type as string;

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.media.count({ where }),
      ]);

      return res.json({
        status: 'success',
        code: 200,
        data: {
          media,
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

  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ status: 'error', code: 400, message: 'No file provided' });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ 
          status: 'error', 
          code: 400, 
          message: `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
        });
      }

      const folder = sanitizeFolder(req.body.folder || 'general');
      const { url, fileName } = await uploadFile(file, folder);

      const fileType = file.mimetype.startsWith('image/')
        ? 'image'
        : file.mimetype.startsWith('video/')
          ? 'video'
          : file.mimetype.includes('pdf')
            ? 'pdf'
            : 'file';

      const media = await prisma.media.create({
        data: {
          fileName,
          fileUrl: url,
          fileType,
          fileSize: String(file.size),
          altText: req.body.altText,
          folder,
          uploadedBy: req.admin?.id,
        },
      });

      return res.status(201).json({ status: 'success', code: 201, data: media });
    } catch (error) {
      console.error('[media.upload] Upload failed:', error);
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.media.delete({ where: { id: req.params.id } });
      return res.json({ status: 'success', code: 200, message: 'Media deleted' });
    } catch (error) {
      next(error);
    }
  },
};
