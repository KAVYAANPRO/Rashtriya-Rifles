const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/autoPlanner.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.post('/', ctrl.autoPlanTrip);

module.exports = router;
