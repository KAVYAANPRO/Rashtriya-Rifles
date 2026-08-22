const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transport.controller');
const authenticate = require('../middleware/authenticate');

// GET /api/v1/transport/search?city=Paris
router.get('/search', authenticate, transportController.searchTransport);

module.exports = router;
