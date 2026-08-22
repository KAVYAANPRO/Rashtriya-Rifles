const recommendationService = require('../services/recommendation.service');

const getAffordableActivities = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const result = await recommendationService.getAffordableActivities(req.user.id, tripId, stopId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAffordableActivities };
