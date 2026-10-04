const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// All admin routes require super_admin role
router.use(auth, roleAuth('super_admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/businesses', adminController.getBusinesses);
router.put('/businesses/:id/toggle', adminController.toggleBusiness);
router.get('/owners', adminController.getOwners);
router.get('/customers', adminController.getCustomers);
router.get('/products', adminController.getAllProducts);
router.get('/orders', adminController.getAllOrders);
router.get('/analytics', adminController.getAnalytics);
router.get('/activity-logs', adminController.getActivityLogs);

module.exports = router;