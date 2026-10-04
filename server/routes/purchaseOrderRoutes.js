const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');
const { purchaseOrderValidation } = require('../validations/validators');

// Owner routes
router.get('/', auth, roleAuth('owner'), businessAuth, purchaseOrderController.getPurchaseOrders);
router.post('/', auth, roleAuth('owner'), businessAuth, purchaseOrderValidation, purchaseOrderController.createPurchaseOrder);
router.get('/:id', auth, roleAuth('owner'), businessAuth, purchaseOrderController.getPurchaseOrderById);
router.put('/:id/status', auth, roleAuth('owner'), businessAuth, purchaseOrderController.updatePurchaseOrderStatus);
router.post('/:id/receive', auth, roleAuth('owner'), businessAuth, purchaseOrderController.receivePurchaseOrder);

module.exports = router;