const pool = require('../config/database');
const { getGeminiModel, isGeminiAvailable } = require('../config/gemini');
const recommendationService = require('../services/recommendationService');

// Get AI insights for a business
const getInsights = async (req, res) => {
  try {
    const { businessId } = req.params;

    const [insights] = await pool.query(`
      SELECT * FROM ai_insights
      WHERE business_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 10
    `, [businessId]);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights'
    });
  }
};

// Predict stock-out risk for ALL products
const predictStockout = async (req, res) => {
  try {
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

    const [products] = await pool.query(`
      SELECT p.id, p.name, p.stock_quantity, p.min_stock_level, p.unit
      FROM products p
      WHERE p.business_id = ? AND p.is_active = TRUE
    `, [businessId]);

    const predictions = [];

    for (const product of products) {
      const [salesData] = await pool.query(`
        SELECT COALESCE(SUM(oi.quantity), 0) as total_quantity
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = ? 
        AND o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.order_status != 'cancelled'
      `, [product.id]);

      const totalSold = parseFloat(salesData[0].total_quantity) || 0;
      const avgDailyDemand = totalSold / 30;
      const daysRemaining = avgDailyDemand > 0 
        ? Math.floor(product.stock_quantity / avgDailyDemand) 
        : 999;

      const isAtRisk = 
        product.stock_quantity <= product.min_stock_level || 
        (avgDailyDemand > 0 && daysRemaining < 7);

      if (isAtRisk) {
        predictions.push({
          productId: product.id,
          productName: product.name,
          currentStock: parseFloat(product.stock_quantity),
          minStockLevel: parseFloat(product.min_stock_level),
          unit: product.unit,
          avgDailyDemand: parseFloat(avgDailyDemand.toFixed(3)),
          daysRemaining: daysRemaining,
          isAtRisk: true,
          riskLevel: product.stock_quantity <= product.min_stock_level ? 'critical' : 'high',
          reorderQuantity: Math.max(
            Math.ceil((avgDailyDemand * 7) - product.stock_quantity + product.min_stock_level),
            0
          )
        });
      }
    }

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Predict stockout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict stockout',
      error: error.message
    });
  }
};

// Get reorder recommendations
const reorderRecommendation = async (req, res) => {
  try {
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

    const [products] = await pool.query(`
      SELECT 
        p.id, p.name, p.stock_quantity, p.min_stock_level, p.unit,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.order_status != 'cancelled'
      WHERE p.business_id = ? AND p.is_active = TRUE
      GROUP BY p.id, p.name, p.stock_quantity, p.min_stock_level, p.unit
    `, [businessId]);

    const recommendations = [];

    for (const product of products) {
      const totalSold = parseFloat(product.total_sold) || 0;
      const avgDailyDemand = totalSold / 30;
      const currentStock = parseFloat(product.stock_quantity);
      const minStock = parseFloat(product.min_stock_level);
      const requiredStock = (avgDailyDemand * 7) + minStock;
      const reorderQty = Math.ceil(requiredStock - currentStock);

      if (reorderQty > 0) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          currentStock: currentStock,
          minStockLevel: minStock,
          unit: product.unit,
          avgDailyDemand: parseFloat(avgDailyDemand.toFixed(3)),
          reorderQuantity: reorderQty,
          priority: currentStock <= minStock ? 'high' : 'medium'
        });
      }
    }

    recommendations.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return a.currentStock - b.currentStock;
    });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Reorder recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reorder recommendations',
      error: error.message
    });
  }
};

// Detect dead stock
const detectDeadStock = async (req, res) => {
  try {
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

    const [deadStock] = await pool.query(`
      SELECT 
        p.id, p.name, p.category, p.brand, p.stock_quantity, p.price, p.unit,
        COALESCE(DATEDIFF(NOW(), MAX(o.order_date)), DATEDIFF(NOW(), p.created_at)) as days_since_last_sale
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status != 'cancelled'
      WHERE p.business_id = ? AND p.is_active = TRUE
      GROUP BY p.id, p.name, p.category, p.brand, p.stock_quantity, p.price, p.unit, p.created_at
      HAVING days_since_last_sale > 30
      ORDER BY days_since_last_sale DESC
    `, [businessId]);

    res.json({
      success: true,
      data: deadStock
    });
  } catch (error) {
    console.error('Detect dead stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect dead stock',
      error: error.message
    });
  }
};

// Get supplier insights
const supplierInsights = async (req, res) => {
  try {
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
        s.id, s.name, s.company_name, s.email, s.phone,
        s.on_time_percentage, s.performance_score, s.avg_delivery_time,
        s.total_orders, s.delayed_orders,
        COUNT(DISTINCT sp.product_id) as product_count
      FROM suppliers s
      LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
      WHERE s.business_id = ? AND s.is_active = TRUE
      GROUP BY s.id, s.name, s.company_name, s.email, s.phone,
               s.on_time_percentage, s.performance_score, s.avg_delivery_time,
               s.total_orders, s.delayed_orders
      ORDER BY s.performance_score DESC
    `, [businessId]);

    res.json({
      success: true,
      data: { suppliers }
    });
  } catch (error) {
    console.error('Supplier insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier insights',
      error: error.message
    });
  }
};
// ============================================
// FEATURE 5: AI Product Recommendations
// ============================================

// GET /api/ai/recommendations/:productId
// Returns related/in-stock products for a given product.
// Gemini enhances with a friendly explanation (never invents prices/stock).
const getProductRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;

    // Verify product exists and is active (use DB as source of truth)
    const [products] = await pool.query(
      'SELECT id, name FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const result = await recommendationService.getRecommendationsForProduct(
      productId,
      6
    );

    res.json({
      success: true,
      data: {
        baseProduct: products[0],
        recommendations: result.recommendations,
        ai_available: result.ai_available,
      },
    });
  } catch (error) {
    console.error('getProductRecommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message,
    });
  }
};

// POST /api/ai/recommendations/cart
// Body: { items: [{ productId, quantity }] }
// Returns recommendations relevant to cart contents.
const getCartRecommendations = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required',
      });
    }

    const productIds = items
      .map((i) => parseInt(i.productId))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product IDs provided',
      });
    }

    const recommendations = await recommendationService.getRecommendationsForCart(
      productIds,
      6
    );

    res.json({
      success: true,
      data: recommendations,
      ai_available: isGeminiAvailable(),
    });
  } catch (error) {
    console.error('getCartRecommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart recommendations',
      error: error.message,
    });
  }
};

module.exports = {
  getInsights,
  predictStockout,
  reorderRecommendation,
  detectDeadStock,
  supplierInsights,
  getProductRecommendations,
  getCartRecommendations,
};