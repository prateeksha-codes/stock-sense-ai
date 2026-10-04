const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// PUBLIC ROUTE - Get products by business ID (no auth required)
// IMPORTANT: This must come BEFORE the '/:id' route
router.get('/business/:businessId', productController.getProductsByBusiness);

// Owner routes - Get own products
router.get('/', auth, roleAuth('owner'), businessAuth, productController.getProducts);

// Owner routes - Create product
router.post('/', auth, roleAuth('owner'), businessAuth, productController.createProduct);

// Get single product
router.get('/:id', auth, productController.getProductById);

// Update product
router.put('/:id', auth, roleAuth('owner'), businessAuth, productController.updateProduct);

// Delete product
router.delete('/:id', auth, roleAuth('owner'), businessAuth, productController.deleteProduct);

module.exports = router;