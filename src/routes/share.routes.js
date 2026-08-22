const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/share.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createShareSchema } = require('../schemas/share.schema');

router.use(authenticate);
router.post('/', validate(createShareSchema), ctrl.createShareLink);

module.exports = router;
