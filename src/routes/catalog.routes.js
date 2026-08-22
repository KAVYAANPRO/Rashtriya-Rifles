const router = require('express').Router();
const ctrl = require('../controllers/catalog.controller');

// The catalog is public — the marketing page and the trip builder both read it.
router.get('/cities', ctrl.getCities);
router.get('/cities/:id', ctrl.getCityById);
router.get('/categories', ctrl.getCategories);
router.get('/activities', ctrl.getActivities);

module.exports = router;
