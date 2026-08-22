const autoPlannerService = require('../services/autoPlanner.service');

const autoPlanTrip = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const preferences = req.body.preferences || [];
    const dietaryPreference = req.body.dietaryPreference || 'Any';
    
    const result = await autoPlannerService.autoPlanItinerary(req.user.id, tripId, stopId, preferences, dietaryPreference);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { autoPlanTrip };
