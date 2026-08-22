const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/recommendation.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/activities', ctrl.getAffordableActivities);

module.exports = router;
