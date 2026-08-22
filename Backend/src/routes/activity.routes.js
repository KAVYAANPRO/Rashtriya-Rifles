const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/activity.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { addActivitySchema, updateActivitySchema } = require('../schemas/activity.schema');

router.use(authenticate);

router.post('/', validate(addActivitySchema), ctrl.addActivity);
router.get('/', ctrl.getActivities);
router.patch('/:tripActivityId', validate(updateActivitySchema), ctrl.updateActivity);
router.delete('/:tripActivityId', ctrl.removeActivity);

module.exports = router;
