const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingController');

const router = express.Router();

router.use(authRequired);
router.get('/', requireRole('super_admin'), getSettings);
router.put('/', requireRole('super_admin'), updateSettings);

module.exports = router;
