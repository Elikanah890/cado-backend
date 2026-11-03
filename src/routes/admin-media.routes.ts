import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import multer from 'multer';

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_VIDEO_SIZE_MB) || 100;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
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
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', mediaController.getAll);
router.post(
  '/upload',
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              status: 'error',
              code: 413,
              message: `File is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB.`,
            });
          }
          return res.status(400).json({ status: 'error', code: 400, message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ status: 'error', code: 400, message: err.message || 'File upload failed' });
      }
      next();
    });
  },
  activityLogger('Upload Media', 'media'),
  mediaController.upload
);
router.delete('/:id', activityLogger('Delete Media', 'media'), mediaController.delete);

export default router;
