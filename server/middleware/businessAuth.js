const pool = require('../config/database');

const businessAuth = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Super admin can access everything
  if (req.user.role === 'super_admin') {
    return next();
  }

  // For owners, verify they have a business
  if (req.user.role === 'owner') {
    try {
      const [businesses] = await pool.query(
        'SELECT id FROM businesses WHERE owner_id = ?',
        [req.user.id]
      );

      if (businesses.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No business found for this owner.'
        });
      }

      req.businessId = businesses[0].id;
      next();
    } catch (error) {
      console.error('BusinessAuth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying business ownership.'
      });
    }
  } else {
    // Customers don't have business restrictions
    next();
  }
};

module.exports = businessAuth;