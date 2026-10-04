const pool = require('../config/database');

// Get all suppliers for business
const getSuppliers = async (req, res) => {
  try {
    const businessId = req.businessId;

    const [suppliers] = await pool.query(
      `SELECT s.*, 
              COUNT(DISTINCT sp.product_id) as product_count,
              GROUP_CONCAT(DISTINCT p.name) as product_names
       FROM suppliers s
       LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
       LEFT JOIN products p ON sp.product_id = p.id
       WHERE s.business_id = ? AND s.is_active = TRUE
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [businessId]
    );

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
};

// Get single supplier
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    const [suppliers] = await pool.query(
      `SELECT s.*, 
              COUNT(DISTINCT po.id) as total_purchase_orders,
              COALESCE(SUM(po.total_amount), 0) as total_purchase_value
       FROM suppliers s
       LEFT JOIN purchase_orders po ON s.id = po.supplier_id
       WHERE s.id = ? AND s.business_id = ? AND s.is_active = TRUE
       GROUP BY s.id`,
      [id, businessId]
    );

    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get supplier products
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.category, sp.unit_price, sp.is_preferred
       FROM supplier_products sp
       INNER JOIN products p ON sp.product_id = p.id
       WHERE sp.supplier_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...suppliers[0],
        products
      }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier'
    });
  }
};

// Create supplier
const createSupplier = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { name, companyName, phone, email, address, city, state, pincode, notes, productIds } = req.body;

    const [result] = await pool.query(
      `INSERT INTO suppliers (business_id, name, company_name, phone, email, address, city, state, pincode, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, name, companyName, phone, email, address, city, state, pincode, notes]
    );

    // Add product mappings if provided
    if (productIds && productIds.length > 0) {
      for (const productId of productIds) {
        await pool.query(
          'INSERT INTO supplier_products (supplier_id, product_id) VALUES (?, ?)',
          [result.insertId, productId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier'
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.businessId;
    const { name, companyName, phone, email, address, city, state, pincode, notes } = req.body;

    await pool.query(
      `UPDATE suppliers 
       SET name = ?, company_name = ?, phone = ?, email = ?, address = ?, city = ?, state = ?, pincode = ?, notes = ?
       WHERE id = ? AND business_id = ?`,
      [name, companyName, phone, email, address, city, state, pincode, notes, id, businessId]
    );

    res.json({
      success: true,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier'
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    await pool.query(
      'UPDATE suppliers SET is_active = FALSE WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier'
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};