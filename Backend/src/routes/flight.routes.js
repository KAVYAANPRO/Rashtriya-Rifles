const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight.controller');
const authenticate = require('../middleware/authenticate');

// GET /api/v1/flights/search?origin=JFK&destination=CDG&date=2026-08-23
router.get('/search', authenticate, flightController.searchFlights);

module.exports = router;
