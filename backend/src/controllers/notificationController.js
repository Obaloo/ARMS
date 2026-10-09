const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(notifications);
};

const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOne({ _id: id, user: req.user._id });
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  notification.read = true;
  await notification.save();
  return res.json(notification);
};

module.exports = { listNotifications, markNotificationRead };
