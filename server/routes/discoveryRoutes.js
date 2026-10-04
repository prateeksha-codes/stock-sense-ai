const express = require('express');
const router = express.Router();
const discoveryController = require('../controllers/discoveryController');

// All discovery endpoints are PUBLIC
// (customers browse businesses/products before logging in)

// Feature 1: Nearby businesses
router.get('/nearby', discoveryController.getNearbyBusinesses);

// Feature 2: Smart product search across businesses
router.get('/search-products', discoveryController.searchProducts);

// Filter dropdown data
router.get('/filters', discoveryController.getFilterOptions);


// Geocoding: address text → lat/lng
router.get('/geocode', discoveryController.geocodeAddress);
module.exports = router;