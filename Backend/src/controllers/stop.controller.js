const stopService = require('../services/stop.service');

const addStop = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stop = await stopService.addStop(req.user.id, tripId, req.body);
    res.status(201).json({ success: true, data: stop });
  } catch (error) {
    next(error);
  }
};

const getTripStops = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stops = await stopService.getTripStops(req.user.id, tripId);
    res.status(200).json({ success: true, data: stops });
  } catch (error) {
    next(error);
  }
};

const getStop = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const stop = await stopService.getStop(req.user.id, tripId, stopId);
    res.status(200).json({ success: true, data: stop });
  } catch (error) {
    next(error);
  }
};

const updateStop = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const stop = await stopService.updateStop(req.user.id, tripId, stopId, req.body);
    res.status(200).json({ success: true, data: stop });
  } catch (error) {
    next(error);
  }
};

const deleteStop = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    const result = await stopService.deleteStop(req.user.id, tripId, stopId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { addStop, getTripStops, getStop, updateStop, deleteStop };
