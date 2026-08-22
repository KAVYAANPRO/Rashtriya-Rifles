const tripActivityService = require('../services/tripActivity.service');

const addActivity = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const activity = await tripActivityService.addActivity(req.user.id, tripId, stopId, req.body);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

module.exports = { addActivity };
