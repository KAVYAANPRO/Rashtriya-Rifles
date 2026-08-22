const budgetService = require('../services/budget.service');

const getTripBudget = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const budget = await budgetService.getTripBudget(req.user.id, tripId);
    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

const upsertTripBudget = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const budget = await budgetService.upsertTripBudget(req.user.id, tripId, req.body);
    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTripBudget, upsertTripBudget };
