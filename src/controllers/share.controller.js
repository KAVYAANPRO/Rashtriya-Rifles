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

const getPublicTrip = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const result = await shareService.getPublicTripBySlug(slug);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createShareLink, getPublicTrip };
