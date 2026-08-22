const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotel.controller');
const authenticate = require('../middleware/authenticate');

// GET /api/v1/hotels/search?city=Paris&checkIn=2026-08-23&checkOut=2026-08-30&guests=2
router.get('/search', authenticate, hotelController.searchHotels);

module.exports = router;
