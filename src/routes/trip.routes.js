const router = require('express').Router();
const ctrl = require('../controllers/trip.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createTripSchema, updateTripSchema } = require('../schemas/trip.schema');
const stopRoutes = require('./stop.routes');
const activityRoutes = require('./activity.routes');
const budgetRoutes = require('./budget.routes');
const recommendationRoutes = require('./recommendation.routes');
const autoPlannerRoutes = require('./autoPlanner.routes');
const shareRoutes = require('./share.routes');
const eventRoutes = require('./event.routes');

// All trip routes require authentication
router.use(authenticate);

router.post('/', validate(createTripSchema), ctrl.createTrip);
router.get('/', ctrl.getUserTrips);
router.get('/:id', ctrl.getTripById);
router.patch('/:id', validate(updateTripSchema), ctrl.updateTrip);
router.delete('/:id', ctrl.deleteTrip);

router.use('/:tripId/stops', stopRoutes);
router.use('/:tripId/stops/:stopId/activities', activityRoutes);
router.use('/:tripId/stops/:stopId/recommendations', recommendationRoutes);
router.use('/:tripId/stops/:stopId/auto-plan', autoPlannerRoutes);
router.use('/:tripId/stops/:stopId/events', eventRoutes);
router.use('/:tripId/budget', budgetRoutes);
router.use('/:tripId/share', shareRoutes);

module.exports = router;
