const router = require('express').Router();
const ctrl = require('../controllers/share.controller');

// Unauthenticated public route
router.get('/trips/:slug', ctrl.getPublicTrip);

module.exports = router;
