const pool = require('../config/database');

// Get delivery tracking
const getTracking = async (req, res) => {
  try {
    const { type, id } = req.params;

    // Validate reference type
    if (!['order', 'purchase_order'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference type'
      });
    }

    // Verify ownership based on user role
    if (req.user.role === 'owner') {
      const tableName = type === 'order' ? 'orders' : 'purchase_orders';
      const [records] = await pool.query(
        `SELECT id FROM ${tableName} WHERE id = ? AND business_id = ?`,
        [id, req.businessId]
      );

      if (records.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'customer' && type === 'order') {
      const [records] = await pool.query(
        'SELECT id FROM orders WHERE id = ? AND customer_id = ?',
        [id, req.user.id]
      );

      if (records.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get tracking history
    const [tracking] = await pool.query(
      `SELECT dt.*, u.full_name as updated_by_name
       FROM delivery_tracking dt
       LEFT JOIN users u ON dt.updated_by = u.id
       WHERE dt.reference_type = ? AND dt.reference_id = ?
       ORDER BY dt.created_at ASC`,
      [type, id]
    );

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking'
    });
  }
};

// Update delivery status
const updateStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, location, notes } = req.body;

    // Validate reference type
    if (!['order', 'purchase_order'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference type'
      });
    }

    // Add tracking entry
    await pool.query(
      `INSERT INTO delivery_tracking (reference_type, reference_id, status, location, notes, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, id, status, location, notes, req.user.id]
    );

    // Update corresponding order/purchase order status
    if (type === 'order') {
      const orderStatusMap = {
        'placed': 'placed',
        'confirmed': 'confirmed',
        'processing': 'processing',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
      };

      if (orderStatusMap[status]) {
        await pool.query(
          'UPDATE orders SET order_status = ? WHERE id = ?',
          [orderStatusMap[status], id]
        );
      }
    } else if (type === 'purchase_order') {
      const poStatusMap = {
        'created': 'created',
        'ordered': 'ordered',
        'shipped': 'shipped',
        'received': 'received',
        'cancelled': 'cancelled',
        'delayed': 'delayed'
      };

      if (poStatusMap[status]) {
        await pool.query(
          'UPDATE purchase_orders SET status = ? WHERE id = ?',
          [poStatusMap[status], id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Delivery status updated successfully'
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status'
    });
  }
};

module.exports = {
  getTracking,
  updateStatus
};