const flightService = require('../services/flight.service');

const searchFlights = async (req, res, next) => {
  try {
    const { origin, destination, date, returnDate, adults, children } = req.query;

    const numAdults = adults ? parseInt(adults) : 1;
    const numChildren = children ? parseInt(children) : 0;

    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, message: 'Origin, destination, and date are required' });
    }

    const flights = await flightService.searchFlights(origin, destination, date, returnDate, numAdults, numChildren);

    res.status(200).json({
      success: true,
      data: flights
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchFlights };
