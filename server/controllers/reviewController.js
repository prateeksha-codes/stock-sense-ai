// ============================================
// Review Controller
// Feature 4: Business Ratings and Reviews
//
// Business rules enforced:
//  - Only delivered orders can be reviewed
//  - One review per order (UNIQUE order_id)
//  - Rating must be 1..5
//  - Customer can only modify their own review
//  - Owner can only see reviews for their own business
// ============================================

const pool = require('../config/database');
const { notifyReviewReceived } = require('../services/notificationService');

// ============================================
// POST /api/reviews
// Customer creates a review for a delivered order
// Body: { orderId, rating, review? }
// ============================================
const createReview = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const customerId = req.user.id;
    const { orderId, rating, review } = req.body;

    // --- Input validation ---
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }
    if (review && review.length > 2000) {
      return res.status(400).json({ success: false, message: 'Review is too long (max 2000 chars)' });
    }

    // --- Verify order belongs to this customer and is delivered ---
    const [orders] = await connection.query(
      `SELECT id, customer_id, business_id, order_status, order_number
       FROM orders
       WHERE id = ? AND customer_id = ?`,
      [orderId, customerId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    if (order.order_status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review delivered orders',
      });
    }

    // --- Check for duplicate review on same order ---
    const [existing] = await connection.query(
      'SELECT id FROM business_reviews WHERE order_id = ?',
      [orderId]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this order',
      });
    }

    // --- Insert the review ---
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO business_reviews 
         (business_id, customer_id, order_id, rating, review) 
       VALUES (?, ?, ?, ?, ?)`,
      [order.business_id, customerId, orderId, ratingNum, review || null]
    );

    await connection.commit();

    // --- Notify owner (fire and forget) ---
    const [customerRows] = await connection.query(
      'SELECT full_name FROM users WHERE id = ?',
      [customerId]
    );
    const customerName = customerRows.length > 0 ? customerRows[0].full_name : 'A customer';

    notifyReviewReceived(order.business_id, customerName, ratingNum, order.order_number).catch(
      (e) => console.error('notifyReviewReceived error:', e.message)
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { reviewId: result.insertId },
    });
  } catch (error) {
    await connection.rollback();
    console.error('createReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// ============================================
// GET /api/reviews/business/:businessId
// Public: list reviews for a business + summary
// ============================================
const getBusinessReviews = async (req, res) => {
  try {
    const { businessId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const [reviews] = await pool.query(
      `SELECT 
         r.id, r.rating, r.review, r.created_at,
         u.full_name AS customer_name,
         o.order_number
       FROM business_reviews r
       INNER JOIN users u ON r.customer_id = u.id
       INNER JOIN orders o ON r.order_id = o.id
       WHERE r.business_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [businessId, limit, offset]
    );

    const [[summary]] = await pool.query(
      `SELECT 
         COALESCE(ROUND(AVG(rating), 2), 0) AS avg_rating,
         COUNT(*) AS review_count,
         COUNT(CASE WHEN rating = 5 THEN 1 END) AS five_star,
         COUNT(CASE WHEN rating = 4 THEN 1 END) AS four_star,
         COUNT(CASE WHEN rating = 3 THEN 1 END) AS three_star,
         COUNT(CASE WHEN rating = 2 THEN 1 END) AS two_star,
         COUNT(CASE WHEN rating = 1 THEN 1 END) AS one_star
       FROM business_reviews
       WHERE business_id = ?`,
      [businessId]
    );

    res.json({
      success: true,
      data: { reviews, summary, page, limit },
    });
  } catch (error) {
    console.error('getBusinessReviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

// ============================================
// GET /api/reviews/my
// Customer: list own reviews
// ============================================
const getMyReviews = async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT 
         r.id, r.rating, r.review, r.created_at,
         r.business_id, b.name AS business_name,
         r.order_id, o.order_number
       FROM business_reviews r
       INNER JOIN businesses b ON r.business_id = b.id
       INNER JOIN orders o ON r.order_id = o.id
       WHERE r.customer_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('getMyReviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews',
      error: error.message,
    });
  }
};

// ============================================
// GET /api/reviews/owner
// Owner: list all reviews for their own business
// ============================================
const getOwnerReviews = async (req, res) => {
  try {
    const [bizRows] = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = ?',
      [req.user.id]
    );
    if (bizRows.length === 0) {
      return res.status(404).json({ success: false, message: 'No business found' });
    }
    const businessId = bizRows[0].id;

    const [reviews] = await pool.query(
      `SELECT 
         r.id, r.rating, r.review, r.created_at,
         u.full_name AS customer_name,
         o.order_number
       FROM business_reviews r
       INNER JOIN users u ON r.customer_id = u.id
       INNER JOIN orders o ON r.order_id = o.id
       WHERE r.business_id = ?
       ORDER BY r.created_at DESC`,
      [businessId]
    );

    const [[summary]] = await pool.query(
      `SELECT 
         COALESCE(ROUND(AVG(rating), 2), 0) AS avg_rating,
         COUNT(*) AS review_count
       FROM business_reviews
       WHERE business_id = ?`,
      [businessId]
    );

    res.json({
      success: true,
      data: { reviews, summary, businessId },
    });
  } catch (error) {
    console.error('getOwnerReviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

// ============================================
// GET /api/reviews/eligible-orders
// Customer: delivered orders that have not been reviewed yet
// ============================================
const getEligibleOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT 
         o.id AS order_id, o.order_number, o.delivery_date,
         b.id AS business_id, b.name AS business_name
       FROM orders o
       INNER JOIN businesses b ON o.business_id = b.id
       WHERE o.customer_id = ?
         AND o.order_status = 'delivered'
         AND NOT EXISTS (
           SELECT 1 FROM business_reviews r WHERE r.order_id = o.id
         )
       ORDER BY o.delivery_date DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('getEligibleOrders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible orders',
      error: error.message,
    });
  }
};

// ============================================
// PUT /api/reviews/:id
// Customer updates their own review
// ============================================
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }
    if (review && review.length > 2000) {
      return res.status(400).json({ success: false, message: 'Review too long (max 2000)' });
    }

    const [rows] = await pool.query(
      'SELECT id, customer_id FROM business_reviews WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await pool.query(
      'UPDATE business_reviews SET rating = ?, review = ? WHERE id = ?',
      [ratingNum, review || null, id]
    );

    res.json({ success: true, message: 'Review updated' });
  } catch (error) {
    console.error('updateReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

// ============================================
// DELETE /api/reviews/:id
// Customer deletes own review
// ============================================
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT id, customer_id FROM business_reviews WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await pool.query('DELETE FROM business_reviews WHERE id = ?', [id]);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('deleteReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getBusinessReviews,
  getMyReviews,
  getOwnerReviews,
  getEligibleOrders,
  updateReview,
  deleteReview,
};