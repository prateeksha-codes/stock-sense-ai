const pool = require('../config/database');
const notificationService = require('../services/notificationService');

// Get inventory overview
const getInventoryOverview = async (req, res) => {
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

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock_quantity * price), 0) as inventory_value,
        COALESCE(SUM(stock_quantity * cost_price), 0) as inventory_cost,
        COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count
       FROM products 
       WHERE business_id = ? AND is_active = TRUE`,
      [businessId]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get inventory overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory overview',
      error: error.message
    });
  }
};

// Get inventory transactions
const getTransactions = async (req, res) => {
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

    const [transactions] = await pool.query(`
      SELECT it.*, p.name as product_name
      FROM inventory_transactions it
      INNER JOIN products p ON it.product_id = p.id
      WHERE it.business_id = ?
      ORDER BY it.created_at DESC
      LIMIT 100
    `, [businessId]);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

// Get stock alerts
const getAlerts = async (req, res) => {
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

    const [alerts] = await pool.query(`
      SELECT a.*, p.name as product_name, p.stock_quantity, p.min_stock_level
      FROM alerts a
      LEFT JOIN products p ON a.product_id = p.id
      WHERE a.business_id = ? AND a.resolved = FALSE
      ORDER BY a.created_at DESC
    `, [businessId]);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
};

// Manual stock adjustment
const addTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get business ID from owner
    const [businesses] = await connection.query(
      'SELECT id FROM businesses WHERE owner_id = ?',
      [req.user.id]
    );

    if (businesses.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No business found'
      });
    }

    const businessId = businesses[0].id;
    const { productId, transactionType, quantity, notes } = req.body;

    await connection.beginTransaction();

    const [products] = await connection.query(
      'SELECT stock_quantity FROM products WHERE id = ? AND business_id = ?',
      [productId, businessId]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStock = parseFloat(products[0].stock_quantity);
    let newStock = currentStock;

    switch (transactionType) {
      case 'stock_in':
        newStock = currentStock + parseFloat(quantity);
        break;
      case 'stock_out':
      case 'damaged':
      case 'returned':
        newStock = currentStock - parseFloat(quantity);
        if (newStock < 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock'
          });
        }
        break;
      default:
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction type'
        });
    }

    await connection.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ? AND business_id = ?',
      [newStock, productId, businessId]
    );

    await connection.query(
      `INSERT INTO inventory_transactions (product_id, business_id, transaction_type, quantity, previous_stock, new_stock, notes, performed_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, businessId, transactionType, parseFloat(quantity), currentStock, newStock, notes, req.user.id]
    );

       await connection.commit();

    // After stock change, check if we need to notify the owner
    const [productRows] = await connection.query(
      'SELECT name, unit, min_stock_level FROM products WHERE id = ?',
      [productId]
    );

    if (productRows.length > 0) {
      const product = productRows[0];
      const minStock = parseFloat(product.min_stock_level);
      const newStockNum = parseFloat(newStock);

      if (newStockNum <= 0) {
        notificationService
          .notifyOutOfStock(businessId, product.name)
          .catch((e) => console.error('notifyOutOfStock error:', e.message));
      } else if (newStockNum <= minStock) {
        notificationService
          .notifyLowStock(businessId, product.name, newStockNum, minStock, product.unit)
          .catch((e) => console.error('notifyLowStock error:', e.message));
      }
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { previousStock: currentStock, newStock }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getInventoryOverview,
  getTransactions,
  getAlerts,
  addTransaction
};