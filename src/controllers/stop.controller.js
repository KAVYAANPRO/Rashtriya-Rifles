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

module.exports = { addStop, getTripStops };
