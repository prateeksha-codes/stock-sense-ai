// ============================================
// Notification Service
// Central helper to create notifications for
// owners and customers. Reused across controllers.
// ============================================

const pool = require('../config/database');

/**
 * Create a notification for a user.
 * @param {number} userId - Target user
 * @param {string} type - e.g. 'order_placed', 'low_stock', 'review_received'
 * @param {string} title - Short title shown in bell dropdown
 * @param {string} message - Full message
 * @param {string|null} referenceType - e.g. 'order', 'product', 'purchase_order'
 * @param {number|null} referenceId - ID of related entity
 */
const createNotification = async (
  userId,
  type,
  title,
  message,
  referenceType = null,
  referenceId = null
) => {
  try {
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, reference_type, reference_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, referenceType, referenceId]
    );
    return true;
  } catch (error) {
    // Notification failures should never break main flow
    console.error('createNotification error:', error.message);
    return false;
  }
};

/**
 * Notify all owners of a specific business.
 * Looks up the owner via businesses.owner_id.
 */
const notifyBusinessOwner = async (
  businessId,
  type,
  title,
  message,
  referenceType = null,
  referenceId = null
) => {
  try {
    const [rows] = await pool.query(
      'SELECT owner_id FROM businesses WHERE id = ?',
      [businessId]
    );
    if (rows.length === 0) return false;

    const ownerId = rows[0].owner_id;
    return await createNotification(
      ownerId,
      type,
      title,
      message,
      referenceType,
      referenceId
    );
  } catch (error) {
    console.error('notifyBusinessOwner error:', error.message);
    return false;
  }
};

/**
 * Notify a customer when their order status changes.
 * Map internal status to a friendly title.
 */
const notifyOrderStatus = async (orderId, newStatus) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.customer_id, b.name AS business_name
       FROM orders o
       INNER JOIN businesses b ON o.business_id = b.id
       WHERE o.id = ?`,
      [orderId]
    );
    if (orders.length === 0) return false;

    const order = orders[0];
    const titleMap = {
      placed: '✓ Order Placed',
      confirmed: '✓ Order Confirmed',
      processing: '📦 Order Processing',
      shipped: '🚚 Order Shipped',
      delivered: '✓ Order Delivered',
      cancelled: '✕ Order Cancelled',
    };

    const title = titleMap[newStatus] || `Order Update: ${newStatus}`;
    const message = `Your order #${order.order_number} from ${order.business_name} is now "${newStatus}".`;

    return await createNotification(
      order.customer_id,
      `order_${newStatus}`,
      title,
      message,
      'order',
      order.id
    );
  } catch (error) {
    console.error('notifyOrderStatus error:', error.message);
    return false;
  }
};

/**
 * Notify customer when a payment succeeds or fails.
 */
const notifyPaymentStatus = async (orderId, paymentStatus) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.customer_id, o.total_amount
       FROM orders o
       WHERE o.id = ?`,
      [orderId]
    );
    if (orders.length === 0) return false;

    const order = orders[0];

    let title, message, type;
    if (paymentStatus === 'paid') {
      title = '✓ Payment Successful';
      message = `Payment of ₹${order.total_amount} received for order #${order.order_number}.`;
      type = 'payment_success';
    } else if (paymentStatus === 'failed') {
      title = '✕ Payment Failed';
      message = `Payment for order #${order.order_number} failed. Please try again.`;
      type = 'payment_failed';
    } else if (paymentStatus === 'refunded') {
      title = 'Payment Refunded';
      message = `Refund of ₹${order.total_amount} processed for order #${order.order_number}.`;
      type = 'payment_refunded';
    } else {
      return false;
    }

    return await createNotification(
      order.customer_id,
      type,
      title,
      message,
      'order',
      order.id
    );
  } catch (error) {
    console.error('notifyPaymentStatus error:', error.message);
    return false;
  }
};

/**
 * Notify owner when a product drops below min_stock_level.
 */
const notifyLowStock = async (businessId, productName, currentStock, minStock, unit = '') => {
  const title = '⚠ Low Stock Alert';
  const message = `${productName} has only ${currentStock}${unit ? ' ' + unit : ''} remaining (min: ${minStock}).`;
  return await notifyBusinessOwner(businessId, 'low_stock', title, message);
};

/**
 * Notify owner when a product hits zero stock.
 */
const notifyOutOfStock = async (businessId, productName) => {
  const title = '🚨 Out of Stock';
  const message = `${productName} is now out of stock. Reorder soon.`;
  return await notifyBusinessOwner(businessId, 'out_of_stock', title, message);
};

/**
 * Notify owner when a purchase order is delayed.
 */
const notifyDelayedPO = async (businessId, poNumber, supplierName, expectedDate) => {
  const title = '🚚 Supplier Delay';
  const message = `Purchase Order ${poNumber} from ${supplierName} is delayed. Expected: ${expectedDate}.`;
  return await notifyBusinessOwner(
    businessId,
    'delivery_delayed',
    title,
    message,
    'purchase_order',
    null
  );
};

/**
 * Notify owner when a new review is received.
 */
const notifyReviewReceived = async (businessId, customerName, rating, orderNumber) => {
  const title = '⭐ New Review Received';
  const message = `${customerName} rated your business ${rating}/5 for order #${orderNumber}.`;
  return await notifyBusinessOwner(businessId, 'review_received', title, message);
};

/**
 * Notify owner about a fresh AI insight.
 */
const notifyAISight = async (businessId, title, message) => {
  return await notifyBusinessOwner(businessId, 'ai_insight', title, message);
};

module.exports = {
  createNotification,
  notifyBusinessOwner,
  notifyOrderStatus,
  notifyPaymentStatus,
  notifyLowStock,
  notifyOutOfStock,
  notifyDelayedPO,
  notifyReviewReceived,
  notifyAISight,
};