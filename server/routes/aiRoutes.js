const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// ============================================
// OWNER routes (existing)
// ============================================
router.get('/insights/:businessId', auth, roleAuth('owner'), businessAuth, aiController.getInsights);
router.post('/predict-stockout', auth, roleAuth('owner'), businessAuth, aiController.predictStockout);
router.post('/reorder-recommendation', auth, roleAuth('owner'), businessAuth, aiController.reorderRecommendation);
router.post('/dead-stock', auth, roleAuth('owner'), businessAuth, aiController.detectDeadStock);
router.post('/supplier-insights', auth, roleAuth('owner'), businessAuth, aiController.supplierInsights);

// ============================================
// FEATURE 5: Product Recommendations (CUSTOMER)
// Public browsing of a product's recommendations uses /:productId below,
// but auth is still required here because it is a customer feature.
// ============================================
router.get(
  '/recommendations/:productId',
  auth,
  roleAuth('customer', 'owner', 'super_admin'),
  aiController.getProductRecommendations
);

router.post(
  '/recommendations/cart',
  auth,
  roleAuth('customer'),
  aiController.getCartRecommendations
);

module.exports = router;