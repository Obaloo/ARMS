const express = require('express');
const { body } = require('express-validator');
const { authRequired } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const {
  registerSuperAdmin,
  registerStudent,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  me,
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register-super-admin',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    validateRequest,
  ],
  registerSuperAdmin
);
router.post(
  '/register-student',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('matricNumber').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    validateRequest,
  ],
  registerStudent
);
router.post('/login', [body('email').isEmail(), body('password').notEmpty(), validateRequest], login);
router.post('/refresh', [body('refreshToken').notEmpty(), validateRequest], refresh);
router.post('/forgot-password', [body('email').isEmail(), validateRequest], forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 6 }), validateRequest], resetPassword);
router.get('/me', authRequired, me);

module.exports = router;
