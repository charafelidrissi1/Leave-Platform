const notificationService = require('../services/notification.service');

async function getNotifications(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const notifications = await notificationService.getUserNotifications(req.user.id, limit, offset);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function markAsRead(req, res) {
  try {
    const notification = await notificationService.markAsRead(parseInt(req.params.id), req.user.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function markAllAsRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
