const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// Customer routes
router.post('/create-order', auth, roleAuth('customer'), paymentController.createPaymentOrder);
router.post('/verify', auth, roleAuth('customer'), paymentController.verifyPayment);
router.post('/confirm-cod', auth, roleAuth('customer'), paymentController.confirmCOD);
router.get('/:orderId', auth, paymentController.getPaymentStatus);

// Owner routes
router.put('/:orderId/cod-paid', auth, roleAuth('owner'), businessAuth, paymentController.markCODPaid);

module.exports = router;