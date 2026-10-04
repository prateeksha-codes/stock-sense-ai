const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// Routes accessible by owner and customer
router.get('/:type/:id', auth, deliveryController.getTracking);

// Owner only routes
router.post('/:type/:id', auth, roleAuth('owner'), businessAuth, deliveryController.updateStatus);

module.exports = router;