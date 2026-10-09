const express = require('express');
const { authRequired } = require('../middleware/auth');
const { listNotifications, markNotificationRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(authRequired);
router.get('/', listNotifications);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
