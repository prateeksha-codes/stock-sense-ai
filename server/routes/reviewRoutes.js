const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// PUBLIC: list reviews for a business
router.get('/business/:businessId', reviewController.getBusinessReviews);

// CUSTOMER routes
router.post('/', auth, roleAuth('customer'), reviewController.createReview);
router.get('/my', auth, roleAuth('customer'), reviewController.getMyReviews);
router.get('/eligible-orders', auth, roleAuth('customer'), reviewController.getEligibleOrders);
router.put('/:id', auth, roleAuth('customer'), reviewController.updateReview);
router.delete('/:id', auth, roleAuth('customer'), reviewController.deleteReview);

// OWNER routes
router.get('/owner', auth, roleAuth('owner'), reviewController.getOwnerReviews);

module.exports = router;