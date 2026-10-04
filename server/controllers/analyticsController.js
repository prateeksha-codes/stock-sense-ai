const pool = require('../config/database');

// Get sales analytics
const getSalesAnalytics = async (req, res) => {
  try {
    // Get business ID from owner
    const [businesses] = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = ?',
      [req.user.id]
    );

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No business found'
      });
    }

    const businessId = businesses[0].id;
    const { period = 'month' } = req.query;

    let dateFilter;
    switch (period) {
      case 'today':
        dateFilter = 'DATE(order_date) = CURDATE()';
        break;
      case 'week':
        dateFilter = 'order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateFilter = 'order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'year':
        dateFilter = 'order_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
      default:
        dateFilter = 'order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // Daily sales trend
    const [salesTrend] = await pool.query(`
      SELECT 
        DATE(order_date) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders
      WHERE business_id = ? AND ${dateFilter} AND order_status != 'cancelled'
      GROUP BY DATE(order_date)
      ORDER BY date ASC
    `, [businessId]);

    // Payment method breakdown
    const [paymentBreakdown] = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE business_id = ? AND ${dateFilter} AND order_status != 'cancelled'
      GROUP BY payment_method
    `, [businessId]);

    // Order status breakdown
    const [statusBreakdown] = await pool.query(`
      SELECT 
        order_status,
        COUNT(*) as count
      FROM orders
      WHERE business_id = ? AND ${dateFilter}
      GROUP BY order_status
    `, [businessId]);

    res.json({
      success: true,
      data: {
        salesTrend,
        paymentBreakdown,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: error.message
    });
  }
};

// Get inventory analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    // Get business ID from owner
    const [businesses] = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = ?',
      [req.user.id]
    );

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No business found'
      });
    }

    const businessId = businesses[0].id;

    // Inventory status
    const [inventoryStatus] = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock_quantity <= min_stock_level AND stock_quantity > 0 THEN 1 END) as low_stock,
        COUNT(CASE WHEN stock_quantity > min_stock_level THEN 1 END) as well_stocked,
        COALESCE(SUM(stock_quantity * price), 0) as inventory_value,
        COALESCE(SUM(stock_quantity * cost_price), 0) as inventory_cost
      FROM products
      WHERE business_id = ? AND is_active = TRUE
    `, [businessId]);

    // Category breakdown
    const [categoryBreakdown] = await pool.query(`
      SELECT 
        category,
        COUNT(*) as product_count,
        COALESCE(SUM(stock_quantity), 0) as total_stock,
        COALESCE(SUM(stock_quantity * price), 0) as category_value
      FROM products
      WHERE business_id = ? AND is_active = TRUE
      GROUP BY category
      ORDER BY category_value DESC
    `, [businessId]);

    res.json({
      success: true,
      data: {
        inventoryStatus: inventoryStatus[0],
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Get inventory analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory analytics',
      error: error.message
    });
  }
};

// Get product performance
const getProductAnalytics = async (req, res) => {
  try {
    // Get business ID from owner
    const [businesses] = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = ?',
      [req.user.id]
    );

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No business found'
      });
    }

    const businessId = businesses[0].id;

    const [topProducts] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock_quantity,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.total_price), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status != 'cancelled'
      WHERE p.business_id = ? AND p.is_active = TRUE
      GROUP BY p.id, p.name, p.category, p.price, p.stock_quantity
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [businessId]);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics',
      error: error.message
    });
  }
};

// Get supplier performance
const getSupplierAnalytics = async (req, res) => {
  try {
    // Get business ID from owner
    const [businesses] = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = ?',
      [req.user.id]
    );

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No business found'
      });
    }

    const businessId = businesses[0].id;

    const [suppliers] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.company_name,
        s.total_orders,
        s.delayed_orders,
        s.on_time_percentage,
        s.performance_score,
        s.avg_delivery_time,
        COUNT(DISTINCT sp.product_id) as product_count
      FROM suppliers s
      LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
      WHERE s.business_id = ? AND s.is_active = TRUE
      GROUP BY s.id, s.name, s.company_name, s.total_orders, s.delayed_orders,
               s.on_time_percentage, s.performance_score, s.avg_delivery_time
      ORDER BY s.performance_score DESC
    `, [businessId]);

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Get supplier analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier analytics',
      error: error.message
    });
  }
};

module.exports = {
  getSalesAnalytics,
  getInventoryAnalytics,
  getProductAnalytics,
  getSupplierAnalytics
};