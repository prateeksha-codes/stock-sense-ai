const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');
const { orderValidation } = require('../validations/validators');

// Customer routes
router.get('/', auth, roleAuth('owner', 'customer'), businessAuth, orderController.getOrders);
router.post('/', auth, roleAuth('customer'), orderValidation, orderController.createOrder);
router.get('/:id', auth, orderController.getOrderById);
router.get('/:id/tracking', auth, orderController.getOrderTracking);

// Owner routes
router.put('/:id/status', auth, roleAuth('owner'), businessAuth, orderController.updateOrderStatus);

module.exports = router;