const express = require('express');
const { body } = require('express-validator');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { markAttendance, overrideAttendance, listAttendance, checkSeatAvailability, downloadSessionAttendance } = require('../controllers/attendanceController');

const router = express.Router();

router.use(authRequired);
router.get('/', listAttendance);
router.get('/seat-availability', requireRole('student'), checkSeatAvailability);
router.get('/:sessionId/download.pdf', requireRole('lecturer', 'super_admin'), downloadSessionAttendance);
router.post(
	'/mark',
	requireRole('student'),
	[body('sessionCode').notEmpty(), body('seatNumber').isInt({ min: 1 }), validateRequest],
	markAttendance
);
router.patch('/:id/override', requireRole('lecturer', 'super_admin'), [body('status').isIn(['present', 'absent', 'late']), validateRequest], overrideAttendance);

module.exports = router;
