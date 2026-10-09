const express = require('express');
const { body } = require('express-validator');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const {
  createCourse,
  updateCourse,
  listCourses,
  listPublicCourses,
  enrollSelf,
  getCourseOverview,
} = require('../controllers/courseController');

const router = express.Router();

router.get('/public', listPublicCourses);
router.use(authRequired);
router.get('/', listCourses);
router.get('/:id/overview', getCourseOverview);
router.post('/enroll-self', requireRole('student'), [body('courseCode').notEmpty(), validateRequest], enrollSelf);
router.post(
  '/',
  requireRole('super_admin', 'lecturer'),
  [body('name').notEmpty(), body('code').notEmpty(), body('lecturerId').notEmpty(), validateRequest],
  createCourse
);
router.put('/:id', requireRole('super_admin'), updateCourse);

module.exports = router;
