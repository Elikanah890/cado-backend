import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/webm',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', mediaController.getAll);
router.post('/upload', upload.single('file'), activityLogger('Upload Media', 'media'), mediaController.upload);
router.delete('/:id', activityLogger('Delete Media', 'media'), mediaController.delete);

export default router;
