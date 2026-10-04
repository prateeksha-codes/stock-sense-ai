const pool = require('../config/database');

// Get admin dashboard stats
const getDashboard = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'owner') as total_owners,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM businesses WHERE is_active = TRUE) as active_businesses,
        (SELECT COUNT(*) FROM businesses) as total_businesses,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
        (SELECT COUNT(*) FROM orders WHERE order_status != 'cancelled') as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid') as platform_sales
    `);

    // Get business type distribution
    const [businessTypes] = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM businesses
      WHERE is_active = TRUE
      GROUP BY type
      ORDER BY count DESC
    `);

    // Get recent registrations
    const [recentBusinesses] = await pool.query(`
      SELECT b.*, u.full_name as owner_name, u.email as owner_email
      FROM businesses b
      INNER JOIN users u ON b.owner_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);

    // Get recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.*, u.full_name as customer_name, b.name as business_name
      FROM orders o
      INNER JOIN users u ON o.customer_id = u.id
      INNER JOIN businesses b ON o.business_id = b.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: stats[0],
        businessTypes,
        recentBusinesses,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard'
    });
  }
};

// Get all businesses
const getBusinesses = async (req, res) => {
  try {
    const [businesses] = await pool.query(`
      SELECT b.*, u.full_name as owner_name, u.email as owner_email, u.mobile as owner_mobile,
             (SELECT COUNT(*) FROM products WHERE business_id = b.id AND is_active = TRUE) as product_count,
             (SELECT COUNT(*) FROM orders WHERE business_id = b.id) as order_count
      FROM businesses b
      INNER JOIN users u ON b.owner_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      data: businesses
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses'
    });
  }
};

// Toggle business active status
const toggleBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const [businesses] = await pool.query(
      'SELECT is_active FROM businesses WHERE id = ?',
      [id]
    );

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const newStatus = !businesses[0].is_active;
    await pool.query(
      'UPDATE businesses SET is_active = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `Business ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle business error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle business'
    });
  }
};

// Get all owners
const getOwners = async (req, res) => {
  try {
    const [owners] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.mobile, u.is_active, u.created_at,
             b.id as business_id, b.name as business_name, b.type as business_type
      FROM users u
      LEFT JOIN businesses b ON u.id = b.owner_id
      WHERE u.role = 'owner'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: owners
    });
  } catch (error) {
    console.error('Get owners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owners'
    });
  }
};

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.mobile, u.is_active, u.created_at,
             cp.city, cp.state,
             (SELECT COUNT(*) FROM orders WHERE customer_id = u.id) as order_count,
             (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = u.id AND payment_status = 'paid') as total_spent
      FROM users u
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// Get all products (admin view)
const getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, b.name as business_name
      FROM products p
      INNER JOIN businesses b ON p.business_id = b.id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Get all orders (admin view)
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.full_name as customer_name, b.name as business_name
      FROM orders o
      INNER JOIN users u ON o.customer_id = u.id
      INNER JOIN businesses b ON o.business_id = b.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Get platform analytics
const getAnalytics = async (req, res) => {
  try {
    // Monthly growth
    const [monthlyGrowth] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM businesses
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);

    // Order analytics
    const [orderAnalytics] = await pool.query(`
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE order_status != 'cancelled'
      AND order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(order_date, '%Y-%m')
      ORDER BY month
    `);

    res.json({
      success: true,
      data: {
        monthlyGrowth,
        orderAnalytics
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT al.*, u.full_name as user_name, u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
};

module.exports = {
  getDashboard,
  getBusinesses,
  toggleBusiness,
  getOwners,
  getCustomers,
  getAllProducts,
  getAllOrders,
  getAnalytics,
  getActivityLogs
};