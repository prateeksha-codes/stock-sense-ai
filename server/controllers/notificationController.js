// ============================================
// Notification Controller
// Feature 6: Smart Notifications and Alerts
//
// Endpoints return notifications for the
// authenticated user (owner or customer).
// Users can only see / modify their own notifications.
// ============================================

const pool = require('../config/database');

// ============================================
// GET /api/notifications
// Returns notifications for the authenticated user.
// Query: ?unread=true&limit=50
// ============================================
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadOnly = req.query.unread === 'true';
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    let query = `
      SELECT 
        id, type, title, message,
        reference_type, reference_id,
        is_read, created_at
      FROM notifications
      WHERE user_id = ?
    `;
    const params = [userId];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(query, params);

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      unread_count: countRow.unread_count,
    });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

// ============================================
// GET /api/notifications/unread-count
// Lightweight endpoint for navbar bell badge.
// ============================================
const getUnreadCount = async (req, res) => {
  try {
    const [[row]] = await pool.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      data: { unread_count: row.unread_count },
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
};

// ============================================
// PUT /api/notifications/:id/read
// Mark a single notification as read.
// ============================================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: error.message,
    });
  }
};

// ============================================
// PUT /api/notifications/mark-all-read
// ============================================
const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message,
    });
  }
};

// ============================================
// DELETE /api/notifications/:id
// ============================================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

// ============================================
// DELETE /api/notifications/clear-read
// Optional: clear all read notifications
// ============================================
const clearRead = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Read notifications cleared',
      deleted: result.affectedRows,
    });
  } catch (error) {
    console.error('clearRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearRead,
};