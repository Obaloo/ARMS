const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const { superAdminDashboard, lecturerDashboard, studentDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authRequired);
router.get('/super-admin', requireRole('super_admin'), superAdminDashboard);
router.get('/lecturer', requireRole('lecturer'), lecturerDashboard);
router.get('/student', requireRole('student'), studentDashboard);

module.exports = router;
