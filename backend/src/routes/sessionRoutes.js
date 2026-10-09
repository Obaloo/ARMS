const express = require('express');
const { body } = require('express-validator');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { createSession, setSessionState, setSessionHeadcount, listSessions, deleteSession } = require('../controllers/sessionController');

const router = express.Router();

router.use(authRequired);
router.get('/', listSessions);
router.post(
  '/',
  requireRole('lecturer', 'super_admin'),
  [
    body('courseId').notEmpty(),
    body('title').notEmpty(),
    body('startsAt').notEmpty(),
    body('endsAt').notEmpty(),
    body('codeRotationSeconds').optional().isIn([0, 30, 60]),
    validateRequest,
  ],
  createSession
);
router.patch('/:id/state', requireRole('lecturer', 'super_admin'), [body('isOpen').isBoolean(), validateRequest], setSessionState);
router.patch('/:id/headcount', requireRole('lecturer', 'super_admin'), [body('actualHeadcount').isInt({ min: 1 }), validateRequest], setSessionHeadcount);
router.delete('/:id', requireRole('lecturer', 'super_admin'), deleteSession);

module.exports = router;
