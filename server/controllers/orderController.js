const pool = require('../config/database');
const { generateOrderNumber } = require('../utils/helpers');
const notificationService = require('../services/notificationService');

// Get orders (owner or customer)
const getOrders = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'owner') {
      query = `
        SELECT o.*, u.full_name as customer_name, u.email as customer_email, u.mobile as customer_mobile
        FROM orders o
        INNER JOIN users u ON o.customer_id = u.id
        WHERE o.business_id = ?`;
      params.push(req.businessId);
    } else if (req.user.role === 'customer') {
      query = `
        SELECT o.*, b.name as business_name
        FROM orders o
        INNER JOIN businesses b ON o.business_id = b.id
        WHERE o.customer_id = ?`;
      params.push(req.user.id);
    } else {
      query = `
        SELECT o.*, u.full_name as customer_name, b.name as business_name
        FROM orders o
        INNER JOIN users u ON o.customer_id = u.id
        INNER JOIN businesses b ON o.business_id = b.id`;
    }

    query += ' ORDER BY o.created_at DESC LIMIT 100';

    const [orders] = await pool.query(query, params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT o.*, u.full_name as customer_name, u.email as customer_email, u.mobile as customer_mobile,
              b.name as business_name, a.address_line, a.city, a.state, a.pincode
       FROM orders o
       INNER JOIN users u ON o.customer_id = u.id
       INNER JOIN businesses b ON o.business_id = b.id
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name, p.image_url
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...orders[0],
        items
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

// Create order
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { businessId, items, paymentMethod, shippingAddressId } = req.body;
    const customerId = req.user.id;

    await connection.beginTransaction();

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const [products] = await connection.query(
        'SELECT * FROM products WHERE id = ? AND business_id = ? AND is_active = TRUE',
        [item.productId, businessId]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      const product = products[0];

      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
        });
      }

      const totalPrice = product.price * item.quantity;
      totalAmount += totalPrice;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
        productSnapshot: {
          name: product.name,
          brand: product.brand,
          unit: product.unit
        }
      });
    }

    // Get shipping address snapshot
    const [addresses] = await connection.query(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [shippingAddressId, customerId]
    );

    if (addresses.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping address'
      });
    }

    const address = addresses[0];
    const addressSnapshot = JSON.stringify({
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type: address.type
    });

    // Create order
    const orderNumber = generateOrderNumber('ORD');
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, business_id, order_number, total_amount, payment_method, payment_status, order_status, shipping_address_id, shipping_address_snapshot) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, businessId, orderNumber, totalAmount, paymentMethod, 'pending', 'placed', shippingAddressId, addressSnapshot]
    );

    // Insert order items
    for (const item of orderItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot) VALUES (?, ?, ?, ?, ?, ?)',
        [orderResult.insertId, item.productId, item.quantity, item.unitPrice, item.totalPrice, JSON.stringify(item.productSnapshot)]
      );

      // Update stock
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.productId]
      );

      // Record inventory transaction
      await connection.query(
        `INSERT INTO inventory_transactions (product_id, business_id, transaction_type, quantity, reference_type, reference_id, notes, performed_by) 
         VALUES (?, ?, 'stock_out', ?, 'order', ?, ?, ?)`,
        [item.productId, businessId, item.quantity, orderResult.insertId, 'Order placed', customerId]
      );
    }

    // Create payment record
    await connection.query(
      'INSERT INTO payments (order_id, amount, payment_method, status) VALUES (?, ?, ?, ?)',
      [orderResult.insertId, totalAmount, paymentMethod, 'pending']
    );

        await connection.commit();

    // Notify the customer their order is placed (fire and forget)
    notificationService
      .notifyOrderStatus(orderResult.insertId, 'placed')
      .catch((e) => console.error('notifyOrderStatus (placed) error:', e.message));

    // Notify the owner that a new order has arrived (fire and forget)
    notificationService
      .notifyBusinessOwner(
        businessId,
        'new_order',
        '🛒 New Order Received',
        `New order #${orderNumber} worth ₹${totalAmount}.`,
        'order',
        orderResult.insertId
      )
      .catch((e) => console.error('notifyBusinessOwner (new order) error:', e.message));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: orderResult.insertId,
        orderNumber,
        totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  } finally {
    connection.release();
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const businessId = req.businessId;

    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Update order
    await pool.query(
      'UPDATE orders SET order_status = ?, delivery_date = CASE WHEN ? = "delivered" THEN NOW() ELSE delivery_date END WHERE id = ? AND business_id = ?',
      [status, status, id, businessId]
    );

    // Add delivery tracking
    await pool.query(
      'INSERT INTO delivery_tracking (reference_type, reference_id, status, updated_by) VALUES (?, ?, ?, ?)',
      ['order', id, status, req.user.id]
    );

    // If cancelled, restore stock
    if (status === 'cancelled') {
      const [items] = await pool.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        await pool.query(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        await pool.query(
          `INSERT INTO inventory_transactions (product_id, business_id, transaction_type, quantity, reference_type, reference_id, notes, performed_by) 
           VALUES (?, ?, 'returned', ?, 'order', ?, ?, ?)`,
          [item.product_id, businessId, item.quantity, id, 'Order cancelled', req.user.id]
        );
      }
    }

        // Notify the customer about the status change (fire and forget)
    notificationService.notifyOrderStatus(id, status).catch((e) =>
      console.error('notifyOrderStatus error:', e.message)
    );

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// Get order tracking
const getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;

    const [tracking] = await pool.query(
      'SELECT * FROM delivery_tracking WHERE reference_type = "order" AND reference_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrderTracking
};