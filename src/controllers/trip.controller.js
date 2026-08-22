const tripService = require('../services/trip.service');

const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.user.id, req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

const getUserTrips = async (req, res, next) => {
  try {
    const trips = await tripService.getUserTrips(req.user.id);
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const trip = await tripService.getTripById(req.user.id, tripId);
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const trip = await tripService.updateTrip(req.user.id, tripId, req.body);
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

const deleteTrip = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const result = await tripService.deleteTrip(req.user.id, tripId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip
};
