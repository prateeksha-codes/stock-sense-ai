const pool = require('../config/database');

// Get customer profile
const getProfile = async (req, res) => {
  try {
    const [profiles] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.role,
              cp.profile_image, cp.city, cp.state, cp.pincode
       FROM users u
       LEFT JOIN customer_profiles cp ON u.id = cp.user_id
       WHERE u.id = ? AND u.role = 'customer'`,
      [req.user.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profiles[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update customer profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, mobile, city, state, pincode, profileImage } = req.body;

    // Update users table
    await pool.query(
      'UPDATE users SET full_name = ?, mobile = ? WHERE id = ?',
      [fullName, mobile, req.user.id]
    );

    // Update customer profile
    await pool.query(
      `UPDATE customer_profiles 
       SET city = ?, state = ?, pincode = ?, profile_image = ?
       WHERE user_id = ?`,
      [city, state, pincode, profileImage, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Get addresses
const getAddresses = async (req, res) => {
  try {
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
};

// Add address
const addAddress = async (req, res) => {
  try {
    const { addressLine, city, state, pincode, isDefault, type } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [req.user.id]
      );
    }

    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, address_line, city, state, pincode, is_default, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, addressLine, city, state, pincode, isDefault || false, type || 'shipping']
    );

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address'
    });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { addressLine, city, state, pincode, isDefault, type } = req.body;

    if (isDefault) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [req.user.id]
      );
    }

    await pool.query(
      'UPDATE addresses SET address_line = ?, city = ?, state = ?, pincode = ?, is_default = ?, type = ? WHERE id = ? AND user_id = ?',
      [addressLine, city, state, pincode, isDefault || false, type || 'shipping', id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
};

// ============================================
// Discovery Location (for Nearby feature)
// GET /api/customers/discovery-location
// ============================================
const getDiscoveryLocation = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT latitude, longitude FROM customer_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: { latitude: null, longitude: null },
      });
    }

    res.json({
      success: true,
      data: {
        latitude: rows[0].latitude,
        longitude: rows[0].longitude,
      },
    });
  } catch (error) {
    console.error('getDiscoveryLocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message,
    });
  }
};

// ============================================
// Update Discovery Location
// PUT /api/customers/discovery-location
// Body: { latitude, longitude }
// ============================================
const updateDiscoveryLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required',
      });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        success: false,
        message: 'Latitude/longitude out of range',
      });
    }

    await pool.query(
      'UPDATE customer_profiles SET latitude = ?, longitude = ? WHERE user_id = ?',
      [latNum, lngNum, req.user.id]
    );

    res.json({
      success: true,
      message: 'Location saved',
      data: { latitude: latNum, longitude: lngNum },
    });
  } catch (error) {
    console.error('updateDiscoveryLocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save location',
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getDiscoveryLocation,       
  updateDiscoveryLocation, 
};