const pool = require('../config/database');

// PUBLIC: Get products by business ID (no auth required)
const getProductsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const [products] = await pool.query(
      `SELECT p.*, 
              GROUP_CONCAT(DISTINCT s.name) as supplier_names,
              COUNT(DISTINCT sp.supplier_id) as supplier_count
       FROM products p
       LEFT JOIN supplier_products sp ON p.id = sp.product_id
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE p.business_id = ? AND p.is_active = TRUE
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [businessId]
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products by business error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get all products for a business (owner only)
const getProducts = async (req, res) => {
  try {
    let businessId;
    
    // If owner, get business ID from their user record
    if (req.user && req.user.role === 'owner') {
      const [businesses] = await pool.query(
        'SELECT id FROM businesses WHERE owner_id = ?',
        [req.user.id]
      );
      if (businesses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No business found for this owner'
        });
      }
      businessId = businesses[0].id;
    } else {
      businessId = req.params.businessId || req.query.businessId;
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const [products] = await pool.query(
      `SELECT p.*, 
              GROUP_CONCAT(DISTINCT s.name) as supplier_names,
              COUNT(DISTINCT sp.supplier_id) as supplier_count
       FROM products p
       LEFT JOIN supplier_products sp ON p.id = sp.product_id
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE p.business_id = ? AND p.is_active = TRUE
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [businessId]
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT p.*, 
              GROUP_CONCAT(DISTINCT s.name) as supplier_names,
              GROUP_CONCAT(DISTINCT s.id) as supplier_ids
       FROM products p
       LEFT JOIN supplier_products sp ON p.id = sp.product_id
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE p.id = ? AND p.is_active = TRUE
       GROUP BY p.id`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Create product
const createProduct = async (req, res) => {
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
        message: 'No business found for this owner'
      });
    }

    const businessId = businesses[0].id;
    const { 
      name, category, brand, unit, sku, description, 
      price, costPrice, stockQuantity, minStockLevel, 
      imageUrl, customAttributes 
    } = req.body;

    await connection.beginTransaction();

    // Insert product
    const [result] = await connection.query(
      `INSERT INTO products (business_id, name, category, brand, unit, sku, description, price, cost_price, stock_quantity, min_stock_level, image_url, custom_attributes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId, 
        name, 
        category, 
        brand || null, 
        unit || 'piece', 
        sku || null, 
        description || null, 
        parseFloat(price) || 0, 
        costPrice ? parseFloat(costPrice) : null, 
        parseFloat(stockQuantity) || 0, 
        parseFloat(minStockLevel) || 0, 
        imageUrl || null, 
        customAttributes ? JSON.stringify(customAttributes) : null
      ]
    );

    // Record initial stock if provided
    if (parseFloat(stockQuantity) > 0) {
      await connection.query(
        `INSERT INTO inventory_transactions (product_id, business_id, transaction_type, quantity, reference_type, notes, performed_by) 
         VALUES (?, ?, 'stock_in', ?, 'initial', 'Initial stock', ?)`,
        [result.insertId, businessId, parseFloat(stockQuantity), req.user.id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, brand, unit, sku, description, price, costPrice, minStockLevel, imageUrl } = req.body;

    // Get business ID
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

    await pool.query(
      `UPDATE products 
       SET name = ?, category = ?, brand = ?, unit = ?, sku = ?, description = ?, price = ?, cost_price = ?, min_stock_level = ?, image_url = ?
       WHERE id = ? AND business_id = ?`,
      [name, category, brand || null, unit || 'piece', sku || null, description || null, parseFloat(price), costPrice ? parseFloat(costPrice) : null, parseFloat(minStockLevel) || 0, imageUrl || null, id, businessId]
    );

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Get business ID
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

    await pool.query(
      'UPDATE products SET is_active = FALSE WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  getProductsByBusiness,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};