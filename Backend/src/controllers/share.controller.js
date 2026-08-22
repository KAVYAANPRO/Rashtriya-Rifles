const shareService = require('../services/share.service');

const createShareLink = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const result = await shareService.createShareLink(req.user.id, tripId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getShareLink = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const result = await shareService.getShareLink(req.user.id, tripId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const revokeShareLink = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const result = await shareService.revokeShareLink(req.user.id, tripId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPublicTrip = async (req, res, next) => {
  try {
    const result = await shareService.getPublicTripBySlug(req.params.slug);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createShareLink, getShareLink, revokeShareLink, getPublicTrip };
