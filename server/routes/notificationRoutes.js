const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All notification endpoints require authentication
// (owner or customer — no role restriction)
router.use(auth);

// IMPORTANT: Put specific routes before '/:id' to avoid conflicts
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear-read', notificationController.clearRead);

// General
router.get('/', notificationController.getMyNotifications);

// Per-notification
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
