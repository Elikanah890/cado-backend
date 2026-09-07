import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
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
