const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/stop.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { addStopSchema } = require('../schemas/stop.schema');

router.use(authenticate);

router.post('/', validate(addStopSchema), ctrl.addStop);
router.get('/', ctrl.getTripStops);

module.exports = router;
