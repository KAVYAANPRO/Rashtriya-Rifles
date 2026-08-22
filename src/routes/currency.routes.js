const router = require('express').Router();
const ctrl = require('../controllers/currency.controller');

// GET /api/v1/currency/convert?amount=4850&from=USD&to=INR
router.get('/convert', ctrl.convert);
router.get('/supported', ctrl.supported);

module.exports = router;
