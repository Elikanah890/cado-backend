import { Router } from 'express';
import { adminCourseController, adminModuleController, adminLessonController } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { activityLogger } from '../middleware/activityLogger';
import { validate } from '../middleware/validate';
import { courseSchema, courseModuleSchema, courseLessonSchema } from '../utils/validators';
import { invalidateHomepageCacheOnWrite } from '../middleware/invalidateHomepageCache';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);
router.use(invalidateHomepageCacheOnWrite);

router.get('/', adminCourseController.getAll);
router.post('/', validate(courseSchema), activityLogger('Create Course', 'academy'), adminCourseController.create);
router.put('/:id', validate(courseSchema), activityLogger('Update Course', 'academy'), adminCourseController.update);
router.delete('/:id', activityLogger('Delete Course', 'academy'), adminCourseController.delete);

// Module CRUD
router.post('/:courseId/modules', validate(courseModuleSchema), activityLogger('Create Module', 'academy'), adminModuleController.createModule);
router.put('/modules/:moduleId', validate(courseModuleSchema), activityLogger('Update Module', 'academy'), adminModuleController.updateModule);
router.delete('/modules/:moduleId', activityLogger('Delete Module', 'academy'), adminModuleController.deleteModule);

// Lesson CRUD (nested under module)
router.post('/modules/:moduleId/lessons', validate(courseLessonSchema), activityLogger('Create Lesson', 'academy'), adminLessonController.createLesson);
router.put('/modules/:moduleId/lessons/:lessonId', validate(courseLessonSchema), activityLogger('Update Lesson', 'academy'), adminLessonController.updateLesson);
router.delete('/modules/:moduleId/lessons/:lessonId', activityLogger('Delete Lesson', 'academy'), adminLessonController.deleteLesson);
router.put('/lessons/:id', validate(courseLessonSchema), activityLogger('Update Lesson', 'academy'), adminLessonController.updateLesson);
router.delete('/lessons/:id', activityLogger('Delete Lesson', 'academy'), adminLessonController.deleteLesson);

export default router;
