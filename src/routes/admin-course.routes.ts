import { Router } from 'express';
import { adminCourseController } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { courseSchema, courseLessonSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', adminCourseController.getAll);
router.post('/', validate(courseSchema), activityLogger('Create Course', 'academy'), adminCourseController.create);
router.put('/:id', validate(courseSchema), activityLogger('Update Course', 'academy'), adminCourseController.update);
router.delete('/:id', activityLogger('Delete Course', 'academy'), adminCourseController.delete);

router.post('/:id/lessons', validate(courseLessonSchema), activityLogger('Create Lesson', 'academy'), adminCourseController.createLesson);
router.put('/:id/lessons/:lessonId', validate(courseLessonSchema), activityLogger('Update Lesson', 'academy'), adminCourseController.updateLesson);
router.delete('/:id/lessons/:lessonId', activityLogger('Delete Lesson', 'academy'), adminCourseController.deleteLesson);
router.put('/lessons/:id', validate(courseLessonSchema), activityLogger('Update Lesson', 'academy'), adminCourseController.updateLesson);
router.delete('/lessons/:id', activityLogger('Delete Lesson', 'academy'), adminCourseController.deleteLesson);

export default router;
