const pool = require('../config/database');
const notificationService = require('../services/notificationService');
const Razorpay = require('razorpay');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Initialize Razorpay only if keys are configured
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create Razorpay order for online payment
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total_amount * 100), // Convert to paise
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        orderId: order.id,
        businessId: order.business_id
      }
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    // Verify signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

        if (expectedSignature !== razorpaySignature) {
      // Notify customer of payment failure (fire and forget)
      notificationService
        .notifyPaymentStatus(orderId, 'failed')
        .catch((e) => console.error('notifyPaymentStatus (failed) error:', e.message));

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    await connection.beginTransaction();

    // Update payment record
    await connection.query(
      `UPDATE payments 
       SET status = 'paid', transaction_id = ?, payment_date = NOW()
       WHERE order_id = ?`,
      [razorpayPaymentId, orderId]
    );

    // Update order
    await connection.query(
      `UPDATE orders 
       SET payment_status = 'paid', order_status = 'confirmed'
       WHERE id = ?`,
      [orderId]
    );

       await connection.commit();

    // Notify customer of successful payment (fire and forget)
    notificationService
      .notifyPaymentStatus(orderId, 'paid')
      .catch((e) => console.error('notifyPaymentStatus (paid) error:', e.message));

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  } finally {
    connection.release();
  }
};

// Handle COD confirmation
const confirmCOD = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Update order for COD
    await pool.query(
      `UPDATE orders 
       SET order_status = 'confirmed'
       WHERE id = ? AND payment_method = 'cod'`,
      [orderId]
    );

    res.json({
      success: true,
      message: 'Order confirmed for Cash on Delivery'
    });
  } catch (error) {
    console.error('Confirm COD error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm COD order'
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ?',
      [orderId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payments[0]
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status'
    });
  }
};

// Mark COD payment as paid (when delivered)
const markCODPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const businessId = req.businessId;

    await pool.query(
      `UPDATE payments 
       SET status = 'paid', payment_date = NOW()
       WHERE order_id = ?`,
      [orderId]
    );

    await pool.query(
      `UPDATE orders 
       SET payment_status = 'paid'
       WHERE id = ? AND business_id = ?`,
      [orderId, businessId]
    );

    res.json({
      success: true,
      message: 'Payment marked as paid'
    });
  } catch (error) {
    console.error('Mark COD paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payment as paid'
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  confirmCOD,
  getPaymentStatus,
  markCODPaid
};