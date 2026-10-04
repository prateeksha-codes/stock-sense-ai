const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// Owner routes
router.get('/sales', auth, roleAuth('owner'), businessAuth, analyticsController.getSalesAnalytics);
router.get('/inventory', auth, roleAuth('owner'), businessAuth, analyticsController.getInventoryAnalytics);
router.get('/products', auth, roleAuth('owner'), businessAuth, analyticsController.getProductAnalytics);
router.get('/suppliers', auth, roleAuth('owner'), businessAuth, analyticsController.getSupplierAnalytics);

module.exports = router;