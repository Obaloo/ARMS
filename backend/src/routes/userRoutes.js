const express = require('express');
const { body } = require('express-validator');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { createLecturer, createStudent, enrollStudent, listUsers } = require('../controllers/userController');

const router = express.Router();

router.use(authRequired);
router.get('/', requireRole('super_admin'), listUsers);
router.post(
  '/lecturers',
  requireRole('super_admin'),
  [body('firstName').notEmpty(), body('lastName').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 }), validateRequest],
  createLecturer
);
router.post(
  '/students',
  requireRole('super_admin'),
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('matricNumber').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    validateRequest,
  ],
  createStudent
);
router.post('/enroll', requireRole('super_admin'), [body('studentId').notEmpty(), body('courseId').notEmpty(), validateRequest], enrollStudent);

module.exports = router;
