const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/event.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', ctrl.getLiveEvents);

module.exports = router;
