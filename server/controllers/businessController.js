const pool = require('../config/database');

// Get all businesses (public)
const getAllBusinesses = async (req, res) => {
  try {
    const [businesses] = await pool.query(
      `SELECT b.*, u.full_name AS owner_name, u.email AS owner_email,
              COALESCE(v.avg_rating, 0) AS avg_rating,
              COALESCE(v.review_count, 0) AS review_count,
              (SELECT COUNT(*) FROM products p 
                WHERE p.business_id = b.id 
                  AND p.is_active = TRUE 
                  AND p.stock_quantity > 0) AS available_products
       FROM businesses b
       INNER JOIN users u ON b.owner_id = u.id
       LEFT JOIN v_business_ratings v ON b.id = v.business_id
       WHERE b.is_active = TRUE
       ORDER BY b.created_at DESC`
    );

    res.json({
      success: true,
      data: businesses
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses',
      error: error.message
    });
  }
};

// Get business by ID (public)
const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const [businesses] = await pool.query(
      `SELECT b.*, u.full_name AS owner_name, u.email AS owner_email,
              COALESCE(v.avg_rating, 0) AS avg_rating,
              COALESCE(v.review_count, 0) AS review_count,
              (SELECT COUNT(*) FROM products p 
                WHERE p.business_id = b.id 
                  AND p.is_active = TRUE 
                  AND p.stock_quantity > 0) AS available_products
       FROM businesses b
       INNER JOIN users u ON b.owner_id = u.id
       LEFT JOIN v_business_ratings v ON b.id = v.business_id
       WHERE b.id = ? AND b.is_active = TRUE`,
      [id]
    );

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: businesses[0]
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business',
      error: error.message
    });
  }
};
// Update business (owner only)
const updateBusiness = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { name, description, address, city, state, pincode, contact, gstNumber, regNumber } = req.body;

    await pool.query(
      `UPDATE businesses 
       SET name = ?, description = ?, address = ?, city = ?, state = ?, pincode = ?, contact = ?, gst_number = ?, reg_number = ?
       WHERE id = ? AND owner_id = ?`,
      [name, description, address, city, state, pincode, contact, gstNumber, regNumber, businessId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Business updated successfully'
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business'
    });
  }
};

module.exports = {
  getAllBusinesses,
  getBusinessById,
  updateBusiness
};