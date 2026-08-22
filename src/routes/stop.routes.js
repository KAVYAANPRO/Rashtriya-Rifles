const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/stop.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { addStopSchema, updateStopSchema } = require('../schemas/stop.schema');

router.use(authenticate);

router.post('/', validate(addStopSchema), ctrl.addStop);
router.get('/', ctrl.getTripStops);
router.get('/:stopId', ctrl.getStop);
router.patch('/:stopId', validate(updateStopSchema), ctrl.updateStop);
router.delete('/:stopId', ctrl.deleteStop);

module.exports = router;
