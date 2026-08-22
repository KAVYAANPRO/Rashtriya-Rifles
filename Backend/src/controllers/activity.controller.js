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

const getActivities = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const activities = await tripActivityService.getStopActivities(req.user.id, tripId, stopId);
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

const updateActivity = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const tripActivityId = parseInt(req.params.tripActivityId, 10);
    const activity = await tripActivityService.updateActivity(
      req.user.id,
      tripId,
      stopId,
      tripActivityId,
      req.body,
    );
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

const removeActivity = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const tripActivityId = parseInt(req.params.tripActivityId, 10);
    const result = await tripActivityService.removeActivity(
      req.user.id,
      tripId,
      stopId,
      tripActivityId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { addActivity, getActivities, updateActivity, removeActivity };
