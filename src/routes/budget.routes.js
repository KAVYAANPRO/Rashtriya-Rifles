const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/budget.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { upsertBudgetSchema } = require('../schemas/budget.schema');

router.use(authenticate);

router.get('/', ctrl.getTripBudget);
router.put('/', validate(upsertBudgetSchema), ctrl.upsertTripBudget);

module.exports = router;
