const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/activity.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { addActivitySchema } = require('../schemas/activity.schema');

router.use(authenticate);

router.post('/', validate(addActivitySchema), ctrl.addActivity);

module.exports = router;
