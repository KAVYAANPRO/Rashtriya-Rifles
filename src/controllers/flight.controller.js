const flightService = require('../services/flight.service');

const searchFlights = async (req, res, next) => {
  try {
    const { origin, destination, date, returnDate } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, message: 'Origin, destination, and date are required' });
    }

    const flights = await flightService.searchFlights(origin, destination, date, returnDate);

    res.status(200).json({
      success: true,
      data: flights
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchFlights };
