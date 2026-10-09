const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const { attendanceReportJson, attendanceReportCsv, attendanceReportPdf } = require('../controllers/reportController');

const router = express.Router();

router.use(authRequired);
router.get('/attendance', requireRole('lecturer', 'super_admin'), attendanceReportJson);
router.get('/attendance.csv', requireRole('lecturer', 'super_admin'), attendanceReportCsv);
router.get('/attendance.pdf', requireRole('lecturer', 'super_admin'), attendanceReportPdf);

module.exports = router;
