const pool = require('../config/database');
const { generateOrderNumber } = require('../utils/helpers');
const notificationService = require('../services/notificationService');

// Get all purchase orders
const getPurchaseOrders = async (req, res) => {
  try {
    const businessId = req.businessId;

    const [purchaseOrders] = await pool.query(
      `SELECT po.*, s.name as supplier_name, s.company_name,
              COUNT(DISTINCT poi.id) as item_count
       FROM purchase_orders po
       INNER JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
       WHERE po.business_id = ?
       GROUP BY po.id
       ORDER BY po.created_at DESC`,
      [businessId]
    );

    res.json({
      success: true,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders'
    });
  }
};

// Get single purchase order
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    const [purchaseOrders] = await pool.query(
      `SELECT po.*, s.name as supplier_name, s.company_name, s.phone as supplier_phone, s.email as supplier_email
       FROM purchase_orders po
       INNER JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ? AND po.business_id = ?`,
      [id, businessId]
    );

    if (purchaseOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Get items
    const [items] = await pool.query(
      `SELECT poi.*, p.name as product_name, p.unit
       FROM purchase_order_items poi
       INNER JOIN products p ON poi.product_id = p.id
       WHERE poi.purchase_order_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...purchaseOrders[0],
        items
      }
    });
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order'
    });
  }
};

// Create purchase order
const createPurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const businessId = req.businessId;
    const { supplierId, items, expectedDeliveryDate, notes } = req.body;

    await connection.beginTransaction();

    // Validate supplier
    const [suppliers] = await connection.query(
      'SELECT id FROM suppliers WHERE id = ? AND business_id = ? AND is_active = TRUE',
      [supplierId, businessId]
    );

    if (suppliers.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier'
      });
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    // Create purchase order
    const orderNumber = generateOrderNumber('PO');
    const [poResult] = await connection.query(
      `INSERT INTO purchase_orders (business_id, supplier_id, order_number, total_amount, status, expected_delivery_date, notes, created_by) 
       VALUES (?, ?, ?, ?, 'created', ?, ?, ?)`,
      [businessId, supplierId, orderNumber, totalAmount, expectedDeliveryDate, notes, req.user.id]
    );

    // Insert items
    for (const item of items) {
      await connection.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?)`,
        [poResult.insertId, item.productId, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { id: poResult.insertId, orderNumber }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order'
    });
  } finally {
    connection.release();
  }
};

// Update purchase order status
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const businessId = req.businessId;

    const validStatuses = ['created', 'ordered', 'shipped', 'received', 'cancelled', 'delayed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await pool.query(
      'UPDATE purchase_orders SET status = ? WHERE id = ? AND business_id = ?',
      [status, id, businessId]
    );

    // Add delivery tracking
    await pool.query(
      'INSERT INTO delivery_tracking (reference_type, reference_id, status, updated_by) VALUES (?, ?, ?, ?)',
      ['purchase_order', id, status, req.user.id]
    );

       // If PO is delayed, notify the owner
    if (status === 'delayed') {
      const [poRows] = await pool.query(
        `SELECT po.order_number, po.expected_delivery_date, s.name AS supplier_name
         FROM purchase_orders po
         INNER JOIN suppliers s ON po.supplier_id = s.id
         WHERE po.id = ?`,
        [id]
      );

      if (poRows.length > 0) {
        const po = poRows[0];
        notificationService
          .notifyDelayedPO(
            businessId,
            po.order_number,
            po.supplier_name,
            po.expected_delivery_date
          )
          .catch((e) => console.error('notifyDelayedPO error:', e.message));
      }
    }

    res.json({
      success: true,
      message: 'Purchase order status updated successfully'
    });
  } catch (error) {
    console.error('Update purchase order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// Receive purchase order
const receivePurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const businessId = req.businessId;
    const { receivedQuantities } = req.body; // { productId: quantity }

    await connection.beginTransaction();

    // Get purchase order
    const [orders] = await connection.query(
      'SELECT * FROM purchase_orders WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Get items
    const [items] = await connection.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
      [id]
    );

    for (const item of items) {
      const receivedQty = receivedQuantities[item.product_id] || item.quantity;
      
      // Update received quantity
      await connection.query(
        'UPDATE purchase_order_items SET received_quantity = ? WHERE id = ?',
        [receivedQty, item.id]
      );

      // Update product stock
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [receivedQty, item.product_id]
      );

      // Record inventory transaction
      await connection.query(
        `INSERT INTO inventory_transactions (product_id, business_id, transaction_type, quantity, reference_type, reference_id, notes, performed_by) 
         VALUES (?, ?, 'stock_in', ?, 'purchase_order', ?, ?, ?)`,
        [item.product_id, businessId, receivedQty, id, 'Purchase order received', req.user.id]
      );
    }

    // Update purchase order status
    await connection.query(
      'UPDATE purchase_orders SET status = "received", actual_delivery_date = CURDATE() WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Purchase order received successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Receive purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive purchase order'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder
};